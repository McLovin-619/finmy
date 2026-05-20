import { db } from "@finmy/db";
import { auditLogs, digitalWallets, householdStaff, transactions } from "@finmy/db/schema";
import { zValidator } from "@hono/zod-validator";
import { and, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

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

// ─── Validation schemas ───────────────────────────────────────────────────────

const PaySalarySchema = z.object({
  staffId: z.string().uuid("staffId must be a valid UUID"),
  // All monetary inputs in SAR minor units (halalas). 100 halalas = SAR 1.00.
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

// ─── Router ───────────────────────────────────────────────────────────────────

export const staffRoutes = new Hono();

/**
 * POST /api/staff/pay-salary
 *
 * Deducts the computed salary (base + bonus − deductions) from the employer's
 * digital wallet, advances the staff member's payout schedule, records the
 * transaction, and writes an immutable SAMA-compliant audit log — all inside a
 * single Postgres transaction.
 *
 * Auth: expects `x-user-id` header (employer UUID). In production this header
 * is injected by the Better Auth session middleware; never trust raw client input.
 */
staffRoutes.post("/pay-salary", zValidator("json", PaySalarySchema), async (c) => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const actorId = c.req.header("x-user-id");
  if (!actorId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { staffId, bonusHalalas, deductionHalalas } = c.req.valid("json");

  // ── Fetch staff — membership check: must belong to this employer ──────────
  const [staff] = await db
    .select()
    .from(householdStaff)
    .where(and(eq(householdStaff.id, staffId), eq(householdStaff.employerId, actorId)))
    .limit(1);

  if (!staff) {
    return c.json({ error: "Staff member not found" }, 404);
  }
  if (!staff.isActive) {
    return c.json({ error: "Staff member is inactive" }, 422);
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

  // ── Compute payout ────────────────────────────────────────────────────────
  const totalPayoutHalalas = staff.baseSalaryHalalas + bonusHalalas - deductionHalalas;

  if (totalPayoutHalalas <= 0) {
    return c.json({ error: "Computed payout is zero or negative — check deductions" }, 422);
  }

  // Pre-flight balance check (advisory — the transaction re-checks atomically)
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
    // Deduct balance with an atomic conditional update.
    // The gte() guard re-checks sufficiency inside the transaction,
    // preventing double-spend under concurrent requests.
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

    // No rows updated → concurrent depletion between pre-flight check and now
    if (!updatedWallet) {
      throw new Error("Insufficient balance after recheck — payment aborted");
    }

    // Record the outbound transaction
    const [txRecord] = await tx
      .insert(transactions)
      .values({
        walletId: wallet.id,
        type: "salary_payment",
        amountHalalas: totalPayoutHalalas,
        status: "completed",
        staffRecipientId: staff.id,
        description: `Salary to ${staff.nameEn} (${staff.role}) — base ${staff.baseSalaryHalalas} + bonus ${bonusHalalas} − deductions ${deductionHalalas}`,
        occurredAt: now,
      })
      .returning();

    if (!txRecord) {
      throw new Error("Transaction insert returned no rows");
    }

    // Advance the recurring schedule
    await tx
      .update(householdStaff)
      .set({ nextPayoutDate, updatedAt: now })
      .where(eq(householdStaff.id, staff.id));

    // Immutable SAMA audit log — never updated after insert
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
