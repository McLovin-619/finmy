/**
 * Seed 5 mock users via Better Auth's internal API.
 * Run from apps/api: node --env-file=.env --import tsx src/seed.ts
 *
 * Each user goes through the full signup flow: user → digital_wallet → loyalty row.
 * Mock accounts are marked email_verified so they bypass the OTP flow.
 */
import { auth } from "@finmy/auth";
import { db } from "@finmy/db";
import { users } from "@finmy/db/schema";
import { eq } from "drizzle-orm";

const MOCK_USERS = [
  { name: "Ahmed Al-Rashid",  email: "ahmed@finmy.app",   password: "Password123!" },
  { name: "Sara Al-Zahrani",  email: "sara@finmy.app",    password: "Password123!" },
  { name: "Khalid Al-Otaibi", email: "khalid@finmy.app",  password: "Password123!" },
  { name: "Noura Al-Harbi",   email: "noura@finmy.app",   password: "Password123!" },
  { name: "Faisal Al-Ghamdi", email: "faisal@finmy.app",  password: "Password123!" },
];

async function seed() {
  console.log("Seeding mock users…\n");

  for (const u of MOCK_USERS) {
    try {
      const res = await auth.api.signUpEmail({
        body: { name: u.name, email: u.email, password: u.password },
      });
      await db
        .update(users)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, res.user.id));
      console.log(`  OK    ${u.email}  →  ${res.user.id}`);
    } catch (err: any) {
      const msg = err?.body?.message ?? err?.message ?? String(err);
      if (msg.includes("already exists")) {
        console.log(`  SKIP  ${u.email}  (already exists)`);
      } else {
        console.error(`  FAIL  ${u.email}  —  ${msg}`);
      }
    }
  }

  console.log("\nDone.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
