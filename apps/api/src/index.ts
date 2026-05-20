import { createEnv } from "@finmy/lib";
import { auth } from "@finmy/auth";
import * as Sentry from "@sentry/node";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { z } from "zod";
import { staffRoutes } from "./routes/staff";

// ─── Env ──────────────────────────────────────────────────────────────────────

const env = createEnv(
  z.object({
    DATABASE_URL: z.string().url("must be a valid Neon connection string"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    SENTRY_DSN: z.string().url().optional(),
  }),
  "api",
);

// ─── Sentry ───────────────────────────────────────────────────────────────────

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 0,
  });
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = new Hono().basePath("/api");

app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:8081"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// ─── Routes ───────────────────────────────────────────────────────────────────

// Better Auth handles all /api/auth/** — basePath strips /api, so match /auth/**
app.on(["GET", "POST"], "/auth/**", (c) => auth.handler(c.req.raw));

app.route("/staff", staffRoutes);

app.get("/health", (c) => {
  return c.json({ ok: true, ts: new Date().toISOString() });
});

// 404 fallback
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Unhandled error fallback — never leak stack traces in production
app.onError((err, c) => {
  Sentry.captureException(err);
  console.error("[api] Unhandled error:", err);
  return c.json(
    { error: env.NODE_ENV === "production" ? "Internal server error" : err.message },
    500,
  );
});

// ─── Start ────────────────────────────────────────────────────────────────────

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`[api] Listening on http://localhost:${info.port}`);
});

export default app;
