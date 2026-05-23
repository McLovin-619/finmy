/**
 * One-off password reset.
 * Run from apps/api: node --env-file=.env --import tsx src/reset-password.ts <email> <newPassword>
 */
import { auth } from "@finmy/auth";
import { db } from "@finmy/db";
import { accounts, users } from "@finmy/db/schema";
import { and, eq } from "drizzle-orm";

async function main() {
  const [email, newPassword] = process.argv.slice(2);
  if (!email || !newPassword) {
    console.error("Usage: tsx src/reset-password.ts <email> <password>");
    process.exit(1);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }

  const ctx = await auth.$context;
  const hash = await ctx.password.hash(newPassword);
  const result = await db
    .update(accounts)
    .set({ password: hash, updatedAt: new Date() })
    .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")));

  console.log(`Updated ${result.rowCount ?? 0} credential row(s) for ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
