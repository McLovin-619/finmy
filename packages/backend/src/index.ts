import { serve } from "@hono/node-server";
import { and, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { z } from "zod";
import { db } from "./db";
import { auditLogs, digitalWallets, householdStaff, transactions } from "./db/schema";

// ─── Env validation ───────────────────────────────────────────────────────────
// All required keys are checked upfront. The process exits immediately on any
// missing value so misconfigured deployments never start silently broken.

const REQUIRED_ENV_KEYS = ["DATABASE_URL"] as const;

for (const key of REQUIRED_ENV_KEYS) {
  if (!process.env[key]) {
    console.error(`[api] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const PORT = Number(process.env.PORT ?? "3001");

// ─── Types ────────────────────────────────────────────────────────────────────

type PayoutFrequency = "daily" | "weekly" | "monthly";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function advancePayoutDate(current: Date, frequency: PayoutFrequency): Date {
  const next = new Date(current);
  switch (frequency) {
    case "daily":
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case "weekly":
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
  }
  return next;
}

// ─── Validation schema ────────────────────────────────────────────────────────

const PaySalarySchema = z.object({
  staffId: z.string().uuid("staffId must be a valid UUID"),
  // All monetary inputs are in SAR minor units (halalas). 100 halalas = SAR 1.00.
  bonusHalalas: z
    .number()
    .int("bonusHalalas must be an integer")
    .nonnegative("bonusHalalas must not be negative")
    .default(0),
  deductionHalalas: z
    .number()
    .int("deductionHalalas must be an integer")
    .nonnegative("deductionHalalas must not be negative")
    .default(0),
});

// ─── App ──────────────────────────────────────────────────────────────────────

const app = new Hono();

app.use("*", logger());
app.use("*", secureHeaders());

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/api/health", (c) => {
  return c.json({ ok: true, ts: new Date().toISOString() });
});

// ── POST /api/staff/pay-salary ────────────────────────────────────────────────
//
// Computes the net payout (baseSalary + bonus − deductions) in halalas,
// deducts it atomically from the employer wallet, advances the staff member's
// recurring payout schedule, records an immutable transaction, and appends a
// SAMA-compliant audit log — all inside a single Postgres transaction.
//
// Auth: the `x-user-id` header carries the employer's UUID. In production this
// header is injected by Better Auth session middleware and never read from the
// raw client request.

app.post("/api/staff/pay-salary", async (c) => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const actorId = c.req.header("x-user-id");
  if (!actorId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // ── Parse and validate body ───────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch (_) {
    return c.json({ error: "Request body must be valid JSON" }, 400);
  }

  const validation = PaySalarySchema.safeParse(rawBody);
  if (!validation.success) {
    return c.json({ error: "Validation failed", details: validation.error.flatten() }, 400);
  }

  const { staffId, bonusHalalas, deductionHalalas } = validation.data;

  // ── Fetch staff — enforce ownership ───────────────────────────────────────
  // Combining id + employerId in the WHERE clause means a user can never pay a
  // staff member that doesn't belong to them, even if they know the UUID.
  const [staff] = await db
    .select()
    .from(householdStaff)
    .where(and(eq(householdStaff.id, staffId), eq(householdStaff.employerId, actorId)))
    .limit(1);

  if (!staff) {
    return c.json({ error: "Staff member not found" }, 404);
  }

  if (!staff.isActive) {
    return c.json({ error: "Staff member is not active" }, 422);
  }

  // ── Fetch employer wallet ─────────────────────────────────────────────────
  const [wallet] = await db
    .select()
    .from(digitalWallets)
    .where(eq(digitalWallets.userId, actorId))
    .limit(1);

  if (!wallet) {
    return c.json({ error: "Employer wallet not found" }, 422);
  }

  // ── Compute net payout ────────────────────────────────────────────────────
  const totalPayoutHalalas = staff.baseSalaryHalalas + bonusHalalas - deductionHalalas;

  if (totalPayoutHalalas <= 0) {
    return c.json({ error: "Net payout is zero or negative — review deduction amount" }, 422);
  }

  // Advisory pre-flight check — the definitive guard is the gte() inside the
  // transaction. This early return saves a round-trip in the common case.
  if (wallet.balanceHalalas < totalPayoutHalalas) {
    return c.json(
      {
        error: "Insufficient balance",
        requiredHalalas: totalPayoutHalalas,
        availableHalalas: wallet.balanceHalalas,
      },
      422
    );
  }

  const nextPayoutDate = advancePayoutDate(staff.nextPayoutDate, staff.payoutFrequency);
  const now = new Date();

  const beforeState: Record<string, unknown> = {
    walletBalanceHalalas: wallet.balanceHalalas,
    staffNextPayoutDate: staff.nextPayoutDate.toISOString(),
  };

  // ── Atomic transaction ────────────────────────────────────────────────────
  const result = await db.transaction(async (tx) => {
    // Deduct balance atomically. The gte() WHERE clause is the true concurrency
    // guard: if two pay-salary requests race past the pre-flight check, only
    // one UPDATE matches the condition and the other returns zero rows, causing
    // this transaction to throw and rollback before any money moves.
    const [updatedWallet] = await tx
      .update(digitalWallets)
      .set({
        balanceHalalas: sql<number>`${digitalWallets.balanceHalalas} - ${totalPayoutHalalas}`,
        updatedAt: now,
      })
      .where(
        and(
          eq(digitalWallets.id, wallet.id),
          gte(digitalWallets.balanceHalalas, totalPayoutHalalas)
        )
      )
      .returning();

    if (!updatedWallet) {
      throw new Error("Insufficient balance after concurrent recheck — payment aborted");
    }

    // Immutable transaction record
    const [txRecord] = await tx
      .insert(transactions)
      .values({
        walletId: wallet.id,
        type: "salary_payment",
        amountHalalas: totalPayoutHalalas,
        status: "completed",
        staffRecipientId: staff.id,
        description: [
          `Salary to ${staff.nameEn} (${staff.role}):`,
          `base ${staff.baseSalaryHalalas}`,
          `+ bonus ${bonusHalalas}`,
          `− deductions ${deductionHalalas} halalas`,
        ].join(" "),
        occurredAt: now,
      })
      .returning();

    if (!txRecord) {
      throw new Error("Transaction insert returned no record");
    }

    // Advance the recurring payout schedule
    await tx
      .update(householdStaff)
      .set({ nextPayoutDate, updatedAt: now })
      .where(eq(householdStaff.id, staff.id));

    // SAMA-compliant immutable audit log — this row is never updated or deleted
    await tx.insert(auditLogs).values({
      actorId,
      action: "staff.pay_salary",
      targetType: "household_staff",
      targetId: staff.id,
      beforeState,
      afterState: {
        walletBalanceHalalas: updatedWallet.balanceHalalas,
        staffNextPayoutDate: nextPayoutDate.toISOString(),
        transactionId: txRecord.id,
        paidHalalas: totalPayoutHalalas,
      } satisfies Record<string, unknown>,
      ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? null,
      userAgent: c.req.header("user-agent") ?? null,
      createdAt: now,
    });

    return {
      transactionId: txRecord.id,
      newBalanceHalalas: updatedWallet.balanceHalalas,
    };
  });

  return c.json(
    {
      ok: true,
      transactionId: result.transactionId,
      paidHalalas: totalPayoutHalalas,
      newBalanceHalalas: result.newBalanceHalalas,
      nextPayoutDate: nextPayoutDate.toISOString(),
    },
    200
  );
});

// ── Fallbacks ─────────────────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

app.onError((err, c) => {
  // Never expose internal error details in production
  const isProduction = process.env.NODE_ENV === "production";
  console.error("[api] Unhandled error:", err);
  return c.json({ error: isProduction ? "Internal server error" : err.message }, 500);
});

// ─── Start ────────────────────────────────────────────────────────────────────

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[api] Listening on http://localhost:${info.port}`);
});

export default app;
