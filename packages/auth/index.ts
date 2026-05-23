import { createEnv } from "@finmy/lib";
import { db } from "@finmy/db";
import { accounts, digitalWallets, loyalty, sessions, users, verifications } from "@finmy/db/schema";
import { betterAuth } from "better-auth";
import { bearer, emailOTP } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createMiddleware } from "hono/factory";
import { z } from "zod";

const env = createEnv(
  z.object({
    BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
    BETTER_AUTH_URL: z.string().url("must be a valid URL"),
    RESEND_API_KEY: z.string().optional(),
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
    database: {
      // pg provider sets supportsUUIDs:true which makes "uuid" rely on DB DEFAULT.
      // accounts/sessions/verifications use text(id) with no DB default, so use a
      // function instead — this bypasses the supportsUUIDs check and always passes
      // the UUID as a string value directly.
      generateId: () => crypto.randomUUID(),
    },
    crossSubdomainCookies: { enabled: false },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, token }) => {
      const link = `finmy://reset-password?token=${encodeURIComponent(token)}`;
      if (env.RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "finmy <onboarding@resend.dev>",
            to: user.email,
            subject: "Reset your finmy password",
            html: `<p>Reset your finmy password by tapping the link below. This link expires in 1 hour.</p><p><a href="${link}">Reset password</a></p><p>If you did not request this, your account is safe — ignore this email.</p>`,
          }),
        });
      } else {
        console.log(`[auth] Password reset link for ${user.email}: ${link}`);
      }
    },
  },

  emailVerification: {
    // Fires once the user confirms their address (via OTP or link). We send the
    // welcome email here instead of on signup so it lands after the OTP, not
    // alongside it. Best-effort — never throw, never block the verify response.
    afterEmailVerification: async (user) => {
      if (!env.RESEND_API_KEY) {
        console.log(`[auth] (no RESEND_API_KEY) skipping welcome email for ${user.email}`);
        return;
      }
      const firstName = user.name?.split(" ")[0] ?? "there";
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "finmy <onboarding@resend.dev>",
            to: user.email,
            subject: "Welcome to finmy",
            html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1A1426"><h1 style="font-size:22px;margin:0 0 12px">Welcome to finmy, ${firstName}.</h1><p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0 0 16px">Your wallet is ready. From here you can send money, automate allowances, schedule investments, and track every subscription and bill in one place.</p><p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0 0 24px">No setup needed — just open the app and you are good to go.</p><p style="font-size:12px;color:#9CA3AF;margin:0">If this was not you, reply to this email and we will lock the account.</p></div>`,
          }),
        });
      } catch (err) {
        console.error(`[auth] welcome email failed for ${user.email}`, err);
      }
    },
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
              lifetimeDepositHalalas: 0,
              lifetimeSpendHalalas: 0,
            }),
          ]);
        },
      },
    },
  },

  plugins: [
    bearer(),
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 5,
      storeOTP: "hashed",
      sendVerificationOnSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (env.RESEND_API_KEY) {
          const subject =
            type === "forget-password"
              ? "Your finmy password reset code"
              : type === "sign-in"
                ? "Your finmy sign-in code"
                : "Verify your finmy account";
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "finmy <onboarding@resend.dev>",
              to: email,
              subject,
              html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1A1426"><h1 style="font-size:20px;margin:0 0 8px">Verify your email</h1><p style="font-size:14px;color:#6B7280;margin:0 0 24px">Use the code below to finish signing in to finmy. It expires in 10 minutes.</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;background:#F4F1FA;color:#7C3AED;padding:20px;border-radius:12px">${otp}</div><p style="font-size:12px;color:#9CA3AF;margin:24px 0 0">If you did not request this, ignore this email — your account is safe.</p></div>`,
            }),
          });
        } else {
          console.log(`[auth] OTP ${type} for ${email}: ${otp}`);
        }
      },
    }),
  ],

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
