import { createEnv } from "@finmy/lib";
import { db } from "@finmy/db";
import { accounts, digitalWallets, loyalty, sessions, users, verifications } from "@finmy/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createMiddleware } from "hono/factory";
import { z } from "zod";

const env = createEnv(
  z.object({
    BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
    BETTER_AUTH_URL: z.string().url("must be a valid URL"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
    APPLE_CLIENT_SECRET: z.string().optional(),
  }),
  "auth",
);

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  // Better Auth uses singular model names; our tables are plural
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),

  advanced: {
    // Default generator is nanoid; our schema uses uuid columns throughout
    generateId: () => crypto.randomUUID(),
    crossSubdomainCookies: { enabled: false },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24 * 7,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const bban = user.id.replace(/-/g, "").slice(0, 20).toUpperCase();
          await Promise.all([
            db.insert(digitalWallets).values({
              userId: user.id,
              iban: `SA00${bban}`,
              balanceHalalas: 0,
              currency: "SAR",
            }),
            db.insert(loyalty).values({
              userId: user.id,
              tier: "standard",
              pointsBalance: 0,
              lifetimeDepositHalalas: BigInt(0),
              lifetimeSpendHalalas: BigInt(0),
            }),
          ]);
        },
      },
    },
  },

  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
      ? {
          apple: {
            clientId: env.APPLE_CLIENT_ID,
            clientSecret: env.APPLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
});

export type Auth = typeof auth;
export type SessionUser = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;

export type AuthVariables = {
  user: SessionUser;
  session: Session;
};

export const sessionMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", session.user);
    c.set("session", session.session);

    await next();
  },
);
