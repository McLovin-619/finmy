import { db } from "@finmy/db";
import { digitalWallets, investmentSchedules } from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const scheduleShape = (s: {
  id: string;
  sector: string;
  amountHalalas: number;
  cadence: string;
  nextExecutionDate: Date;
  status: string;
  createdAt: Date;
}) => ({
  id: s.id,
  sector: s.sector,
  amountHalalas: s.amountHalalas,
  cadence: s.cadence,
  nextExecutionDate: s.nextExecutionDate.toISOString(),
  status: s.status,
  createdAt: s.createdAt.toISOString(),
});

export const investmentRoutes = new Hono()
  .use("*", sessionMiddleware)

  // GET /api/investments — user's investment schedules + summary
  .get("/", async (c) => {
    const userId = c.get("user").id;

    const schedules = await db
      .select()
      .from(investmentSchedules)
      .where(eq(investmentSchedules.userId, userId))
      .orderBy(desc(investmentSchedules.createdAt));

    const activeSchedules = schedules.filter((s) => s.status === "active");
    const activeCount = activeSchedules.length;

    const totalMonthlyHalalas = activeSchedules.reduce((sum, s) => {
      if (s.cadence === "monthly") return sum + s.amountHalalas;
      if (s.cadence === "quarterly") return sum + Math.round(s.amountHalalas / 3);
      return sum;
    }, 0);

    return c.json({
      schedules: schedules.map(scheduleShape),
      summary: { totalMonthlyHalalas, activeCount },
    });
  })

  // POST /api/investments — create a new investment schedule
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        sector: z.enum(["us_stocks", "saudi_equities", "real_estate", "sukuk"]),
        amountSar: z.number().positive(),
        cadence: z.enum(["monthly", "quarterly"]),
        nextExecutionDate: z.string().datetime(),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { sector, amountSar, cadence, nextExecutionDate } = c.req.valid("json");
      const amountHalalas = Math.round(amountSar * 100);

      const wallet = await db.query.digitalWallets.findFirst({
        where: eq(digitalWallets.userId, userId),
      });
      if (!wallet) return c.json({ error: "Wallet not found" }, 404);

      const [inserted] = await db
        .insert(investmentSchedules)
        .values({
          userId,
          walletId: wallet.id,
          sector,
          amountHalalas,
          cadence,
          nextExecutionDate: new Date(nextExecutionDate),
          status: "active",
        })
        .returning();

      return c.json({ schedule: scheduleShape(inserted) }, 201);
    },
  )

  // PATCH /api/investments/:id/status — pause, resume, or cancel a schedule
  .patch(
    "/:id/status",
    zValidator(
      "json",
      z.object({
        status: z.enum(["active", "paused", "cancelled"]),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { id } = c.req.param();
      const { status } = c.req.valid("json");

      const existing = await db.query.investmentSchedules.findFirst({
        where: eq(investmentSchedules.id, id),
      });
      if (!existing) return c.json({ error: "Schedule not found" }, 404);
      if (existing.userId !== userId) return c.json({ error: "Forbidden" }, 403);

      const [updated] = await db
        .update(investmentSchedules)
        .set({ status })
        .where(eq(investmentSchedules.id, id))
        .returning();

      return c.json({ schedule: scheduleShape(updated) });
    },
  );
