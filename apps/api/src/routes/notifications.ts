import { db } from "@finmy/db";
import { notifications } from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, lt } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

export const notificationRoutes = new Hono()
  .use("*", sessionMiddleware)

  // GET /api/notifications — cursor-paginated list
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(25),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { cursor, limit } = c.req.valid("query");

      const conditions = [eq(notifications.userId, userId)];
      if (cursor) conditions.push(lt(notifications.createdAt, new Date(cursor)));

      const rows = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null;

      return c.json({
        notifications: page.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          isRead: n.isRead,
          metadata: n.metadata,
          createdAt: n.createdAt,
        })),
        nextCursor,
        hasMore,
      });
    },
  )

  // PATCH /api/notifications/:id/read — mark a notification as read
  .patch("/:id/read", async (c) => {
    const userId = c.get("user").id;
    const notificationId = c.req.param("id");

    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));

    if (result.rowCount === 0) return c.json({ error: "Notification not found" }, 404);

    return c.json({ success: true });
  });
