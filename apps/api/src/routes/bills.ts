import { db } from "@finmy/db";
import { bills, digitalWallets, transactions } from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const billShape = (b: {
  id: string;
  name: string;
  category: string;
  amountHalalas: number;
  nextDueDate: Date;
  autoPay: boolean;
  isActive: boolean;
  provider: string | null;
}) => ({
  id: b.id,
  name: b.name,
  category: b.category,
  amountHalalas: b.amountHalalas,
  nextDueDate: b.nextDueDate.toISOString(),
  autoPay: b.autoPay,
  isActive: b.isActive,
  provider: b.provider,
});

export const billRoutes = new Hono()
  .use("*", sessionMiddleware)

  // GET /api/bills — active bills sorted by nextDueDate ASC
  .get("/", async (c) => {
    const userId = c.get("user").id;

    const rows = await db
      .select()
      .from(bills)
      .where(and(eq(bills.userId, userId), eq(bills.isActive, true)))
      .orderBy(asc(bills.nextDueDate));

    return c.json({ bills: rows.map(billShape) });
  })

  // POST /api/bills — create a new bill
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        name: z.string().max(100),
        category: z.enum(["rent", "utilities", "bnpl", "telecom", "insurance", "other"]),
        amountSar: z.number().min(0),
        nextDueDate: z.string().datetime(),
        autoPay: z.boolean().optional(),
        provider: z.string().max(50).optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { name, category, amountSar, nextDueDate, autoPay, provider } = c.req.valid("json");
      const amountHalalas = Math.round(amountSar * 100);

      const wallet = await db.query.digitalWallets.findFirst({
        where: eq(digitalWallets.userId, userId),
      });
      if (!wallet) return c.json({ error: "Wallet not found" }, 404);

      const [inserted] = await db
        .insert(bills)
        .values({
          userId,
          walletId: wallet.id,
          name,
          category,
          amountHalalas,
          nextDueDate: new Date(nextDueDate),
          autoPay: autoPay ?? false,
          provider: provider ?? null,
          isActive: true,
        })
        .returning();

      return c.json({ bill: billShape(inserted) }, 201);
    },
  )

  // POST /api/bills/:id/pay — pay a bill atomically
  .post("/:id/pay", async (c) => {
    const userId = c.get("user").id;
    const { id } = c.req.param();

    const bill = await db.query.bills.findFirst({
      where: eq(bills.id, id),
    });
    if (!bill) return c.json({ error: "Bill not found" }, 404);
    if (bill.userId !== userId) return c.json({ error: "Forbidden" }, 403);

    const wallet = await db.query.digitalWallets.findFirst({
      where: eq(digitalWallets.userId, userId),
    });
    if (!wallet) return c.json({ error: "Wallet not found" }, 404);

    // Variable-amount bills (amountHalalas === 0) skip the balance check
    if (bill.amountHalalas !== 0 && wallet.balanceHalalas < bill.amountHalalas) {
      return c.json({ error: "Insufficient balance" }, 422);
    }

    const nextDueDate = new Date(bill.nextDueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    await db.transaction(async (tx) => {
      if (bill.amountHalalas !== 0) {
        await tx
          .update(digitalWallets)
          .set({
            balanceHalalas: sql`${digitalWallets.balanceHalalas} - ${bill.amountHalalas}`,
          })
          .where(eq(digitalWallets.id, wallet.id));
      }

      await tx.insert(transactions).values({
        walletId: wallet.id,
        type: "bill_payment",
        amountHalalas: bill.amountHalalas,
        status: "completed",
        description: `Bill payment: ${bill.name}`,
        occurredAt: new Date(),
      });

      await tx
        .update(bills)
        .set({ nextDueDate })
        .where(eq(bills.id, id));
    });

    const updated = await db.query.digitalWallets.findFirst({
      where: eq(digitalWallets.id, wallet.id),
    });

    return c.json({ ok: true, newBalanceSar: (updated?.balanceHalalas ?? 0) / 100 });
  });
