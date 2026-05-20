/**
 * Seeds realistic SAR balances + transaction history for the 5 mock accounts.
 * Run: node --env-file=.env --import tsx src/seed-wallets.ts
 *
 * Safe to re-run — clears existing transactions for these users first,
 * then resets balances and inserts fresh history.
 */
import { db } from "@finmy/db";
import { digitalWallets, transactions, users } from "@finmy/db/schema";
import { eq, inArray } from "drizzle-orm";

const MOCK_EMAILS = [
  "ahmed@finmy.app",
  "sara@finmy.app",
  "khalid@finmy.app",
  "noura@finmy.app",
  "faisal@finmy.app",
];

// SAR balances for each account (converted to halalas: × 100)
const BALANCES_SAR: Record<string, number> = {
  "ahmed@finmy.app":   12_450,
  "sara@finmy.app":     8_300,
  "khalid@finmy.app":  25_000,
  "noura@finmy.app":    5_875,
  "faisal@finmy.app":  18_120,
};

function sar(amount: number) { return Math.round(amount * 100); }
function daysAgo(n: number)  { const d = new Date(); d.setDate(d.getDate() - n); return d; }

async function seed() {
  console.log("Seeding wallet balances + transaction history…\n");

  // Fetch users + wallets
  const rows = await db
    .select({ userId: users.id, email: users.email, walletId: digitalWallets.id })
    .from(users)
    .innerJoin(digitalWallets, eq(users.id, digitalWallets.userId))
    .where(inArray(users.email, MOCK_EMAILS));

  if (rows.length === 0) {
    console.error("No mock users found — run seed.ts first.");
    process.exit(1);
  }

  const byEmail = Object.fromEntries(rows.map((r) => [r.email!, r]));

  for (const email of MOCK_EMAILS) {
    const row = byEmail[email];
    if (!row) { console.log(`  SKIP  ${email} (not found)`); continue; }

    const balanceSar = BALANCES_SAR[email]!;

    // Clear old transactions for this wallet
    await db.delete(transactions).where(eq(transactions.walletId, row.walletId));

    // Set balance
    await db
      .update(digitalWallets)
      .set({ balanceHalalas: sar(balanceSar) })
      .where(eq(digitalWallets.id, row.walletId));

    // Insert transaction history
    await db.insert(transactions).values([
      {
        walletId: row.walletId,
        type: "top_up",
        amountHalalas: sar(balanceSar + 2_000),
        status: "completed",
        description: "Initial wallet top-up",
        occurredAt: daysAgo(30),
      },
      {
        walletId: row.walletId,
        type: "bill_payment",
        amountHalalas: sar(550),
        status: "completed",
        description: "STC Mobile",
        occurredAt: daysAgo(22),
      },
      {
        walletId: row.walletId,
        type: "bill_payment",
        amountHalalas: sar(320),
        status: "completed",
        description: "Netflix",
        occurredAt: daysAgo(15),
      },
      {
        walletId: row.walletId,
        type: "card_payment",
        amountHalalas: sar(180),
        status: "completed",
        description: "HungerStation",
        occurredAt: daysAgo(10),
      },
      {
        walletId: row.walletId,
        type: "card_payment",
        amountHalalas: sar(950),
        status: "completed",
        description: "Carrefour",
        occurredAt: daysAgo(5),
      },
    ]);

    console.log(`  OK    ${email}  →  SAR ${balanceSar.toLocaleString()}`);
  }

  console.log("\nDone.");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
