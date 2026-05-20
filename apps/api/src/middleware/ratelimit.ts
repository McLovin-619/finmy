import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { MiddlewareHandler } from "hono";

type Tier = "auth" | "write" | "read";

let limiters: Record<Tier, Ratelimit> | null = null;

function getLimiters(url: string, token: string): Record<Tier, Ratelimit> {
  if (limiters) return limiters;
  const redis = new Redis({ url, token });
  limiters = {
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "rl:auth",
    }),
    write: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      prefix: "rl:write",
    }),
    read: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      prefix: "rl:read",
    }),
  };
  return limiters;
}

function getTier(method: string, path: string): Tier {
  if (path.includes("/auth/")) return "auth";
  if (method === "GET" || method === "HEAD") return "read";
  return "write";
}

export function rateLimitMiddleware(
  upstashUrl: string | undefined,
  upstashToken: string | undefined,
): MiddlewareHandler {
  return async (c, next) => {
    if (!upstashUrl || !upstashToken) return next();

    const rl = getLimiters(upstashUrl, upstashToken);
    const tier = getTier(c.req.method, c.req.path);

    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown";

    const { success, limit, remaining, reset } = await rl[tier].limit(ip);

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(reset));

    if (!success) {
      return c.json({ error: "Too many requests" }, 429);
    }

    return next();
  };
}
