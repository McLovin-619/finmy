import { db } from "@finmy/db";
import { allowances } from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const allowanceShape = (a: typeof allowances.$inferSelect) => ({
  id: a.id,
  name: a.name,
  relation: a.relation,
  targetIbanOrPhone: a.targetIbanOrPhone,
  amountSar: a.amountHalalas / 100,
  frequency: a.frequency,
  nextPayoutDate: a.nextPayoutDate.toISOString(),
  isActive: a.isActive,
  totalSentSar: a.totalSentHalalas / 100,
  createdAt: a.createdAt.toISOString(),
});

export const allowanceRoutes = new Hono()
  .use("*", sessionMiddleware)

  // GET /api/allowances — list user's allowances ordered by createdAt DESC
  .get("/", async (c) => {
    const userId = c.get("user").id;

    const rows = await db
      .select()
      .from(allowances)
      .where(eq(allowances.userId, userId))
      .orderBy(desc(allowances.createdAt));

    return c.json({ allowances: rows.map(allowanceShape) });
  })

  // POST /api/allowances — create a new allowance
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        name: z.string().min(1).max(100),
        relation: z.enum(["son", "daughter", "staff", "other"]),
        targetIbanOrPhone: z.string().min(5).max(34),
        amountSar: z.number().positive().multipleOf(0.01),
        frequency: z.enum(["daily", "weekly", "monthly"]),
        nextPayoutDate: z.string().datetime(),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { name, relation, targetIbanOrPhone, amountSar, frequency, nextPayoutDate } =
        c.req.valid("json");

      const amountHalalas = Math.round(amountSar * 100);

      const [inserted] = await db
        .insert(allowances)
        .values({
          userId,
          name,
          relation,
          targetIbanOrPhone,
          amountHalalas,
          frequency,
          nextPayoutDate: new Date(nextPayoutDate),
          isActive: true,
          totalSentHalalas: 0,
        })
        .returning();

      return c.json({ allowance: allowanceShape(inserted) }, 201);
    },
  );
