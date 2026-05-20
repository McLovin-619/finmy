import { db } from "@finmy/db";
import { users } from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { zValidator } from "@hono/zod-validator";
import { and, ilike, ne, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const AVATAR_COLORS = ["#7C3AED", "#EC4899", "#059669", "#D97706", "#2563EB", "#DC2626"];

function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export const userRoutes = new Hono()
  .use("*", sessionMiddleware)

  // GET /api/users/search?q=<query> — find finmy users by name or email (excludes self)
  .get(
    "/search",
    zValidator("query", z.object({ q: z.string().min(1).max(100) })),
    async (c) => {
      const currentUserId = c.get("user").id;
      const { q } = c.req.valid("query");
      const term = `%${q}%`;

      const rows = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(
          and(
            ne(users.id, currentUserId),
            or(ilike(users.name, term), ilike(users.email, term)),
          ),
        )
        .limit(10);

      return c.json({
        users: rows.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email ?? "",
          initials: initialsFor(u.name),
          color: colorFor(u.id),
        })),
      });
    },
  );
