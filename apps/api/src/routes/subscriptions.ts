import { db } from "@finmy/db";
import { subscriptions } from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { zValidator } from "@hono/zod-validator";
import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const subscriptionShape = (s: {
  id: string;
  name: string;
  category: string;
  amountHalalas: number;
  cycle: string;
  nextBillingDate: Date;
  isActive: boolean;
}) => ({
  id: s.id,
  name: s.name,
  category: s.category,
  amountHalalas: s.amountHalalas,
  cycle: s.cycle,
  nextBillingDate: s.nextBillingDate.toISOString(),
  isActive: s.isActive,
});

export const subscriptionRoutes = new Hono()
  .use("*", sessionMiddleware)

  // GET /api/subscriptions — all subscriptions + summary
  .get("/", async (c) => {
    const userId = c.get("user").id;

    const rows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(asc(subscriptions.nextBillingDate));

    const active = rows.filter((s) => s.isActive);
    const activeCount = active.length;

    const monthlyTotalHalalas = active.reduce((sum, s) => {
      if (s.cycle === "monthly") return sum + s.amountHalalas;
      if (s.cycle === "yearly") return sum + Math.round(s.amountHalalas / 12);
      return sum;
    }, 0);

    return c.json({
      subscriptions: rows.map(subscriptionShape),
      summary: { activeCount, monthlyTotalHalalas },
    });
  })

  // POST /api/subscriptions — create a subscription record
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        name: z.string().min(1).max(100),
        category: z.enum(["streaming", "music", "gaming", "fitness", "software", "other"]),
        amountSar: z.number().positive(),
        cycle: z.enum(["monthly", "yearly"]),
        nextBillingDate: z.string().datetime(),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { name, category, amountSar, cycle, nextBillingDate } = c.req.valid("json");
      const amountHalalas = Math.round(amountSar * 100);

      const [inserted] = await db
        .insert(subscriptions)
        .values({
          userId,
          name,
          category,
          amountHalalas,
          cycle,
          nextBillingDate: new Date(nextBillingDate),
          isActive: true,
        })
        .returning();

      return c.json({ subscription: subscriptionShape(inserted) }, 201);
    },
  )

  // PATCH /api/subscriptions/:id — toggle isActive
  .patch(
    "/:id",
    zValidator(
      "json",
      z.object({
        isActive: z.boolean(),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { id } = c.req.param();
      const { isActive } = c.req.valid("json");

      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.id, id),
      });
      if (!existing) return c.json({ error: "Subscription not found" }, 404);
      if (existing.userId !== userId) return c.json({ error: "Forbidden" }, 403);

      const [updated] = await db
        .update(subscriptions)
        .set({ isActive })
        .where(eq(subscriptions.id, id))
        .returning();

      return c.json({ subscription: subscriptionShape(updated) });
    },
  );
