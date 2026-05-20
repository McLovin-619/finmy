import { sessionMiddleware } from "@finmy/auth";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

export const pushTokenRoutes = new Hono()
  .use("*", sessionMiddleware)

  // POST /api/push-tokens — register an Expo push token
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        token: z.string().min(1),
        platform: z.enum(["ios", "android", "web"]),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { token, platform } = c.req.valid("json");

      // No DB storage yet — push_tokens table migration pending
      console.log(`[push-tokens] user ${userId} registered ${platform}: ${token}`);

      return c.json({ ok: true });
    },
  );
