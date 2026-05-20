import { db } from "@finmy/db";
import { cards, digitalWallets } from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, notInArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

function formatCard(card: typeof cards.$inferSelect) {
  return {
    id: card.id,
    last4: card.last4,
    network: card.network,
    cardType: card.cardType,
    label: card.label,
    spendLimitSar: card.spendLimitHalalas != null ? card.spendLimitHalalas / 100 : null,
    status: card.status,
    expiresAt: card.expiresAt,
    createdAt: card.createdAt,
  };
}

export const cardRoutes = new Hono()
  .use("*", sessionMiddleware)

  // GET /api/cards — list user's cards
  .get("/", async (c) => {
    const userId = c.get("user").id;

    const rows = await db
      .select()
      .from(cards)
      .where(eq(cards.userId, userId))
      .orderBy(desc(cards.createdAt));

    return c.json(rows.map(formatCard));
  })

  // POST /api/cards/issue — issue a new card
  .post(
    "/issue",
    zValidator(
      "json",
      z.object({
        network: z.enum(["mada", "visa", "mastercard"]),
        cardType: z.enum(["virtual", "physical"]),
        label: z.string().max(50).optional(),
        spendLimitSar: z.number().positive().optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { network, cardType, label, spendLimitSar } = c.req.valid("json");

      const wallet = await db.query.digitalWallets.findFirst({
        where: eq(digitalWallets.userId, userId),
      });
      if (!wallet) return c.json({ error: "Wallet not found" }, 404);

      const last4 = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 3);

      const [card] = await db
        .insert(cards)
        .values({
          userId,
          walletId: wallet.id,
          last4,
          network,
          cardType,
          label: label ?? null,
          spendLimitHalalas: spendLimitSar != null ? Math.round(spendLimitSar * 100) : null,
          status: "active",
          expiresAt,
        })
        .returning();

      return c.json(formatCard(card), 201);
    },
  )

  // POST /api/cards/:id/freeze — freeze a card
  .post("/:id/freeze", async (c) => {
    const userId = c.get("user").id;
    const cardId = c.req.param("id");

    const [updated] = await db
      .update(cards)
      .set({ status: "frozen" })
      .where(
        and(
          eq(cards.id, cardId),
          eq(cards.userId, userId),
          notInArray(cards.status, ["frozen", "cancelled"]),
        ),
      )
      .returning({ id: cards.id });

    if (!updated) {
      // Distinguish "card not yours" from "wrong state" by checking existence.
      const exists = await db.query.cards.findFirst({
        where: and(eq(cards.id, cardId), eq(cards.userId, userId)),
        columns: { status: true },
      });
      if (!exists) return c.json({ error: "Card not found" }, 404);
      return c.json({ error: "Card cannot be frozen in its current state" }, 422);
    }

    return c.json({ success: true });
  })

  // POST /api/cards/:id/cancel — cancel a card
  .post("/:id/cancel", async (c) => {
    const userId = c.get("user").id;
    const cardId = c.req.param("id");

    const [updated] = await db
      .update(cards)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(cards.id, cardId),
          eq(cards.userId, userId),
          notInArray(cards.status, ["cancelled"]),
        ),
      )
      .returning({ id: cards.id });

    if (!updated) {
      const exists = await db.query.cards.findFirst({
        where: and(eq(cards.id, cardId), eq(cards.userId, userId)),
        columns: { status: true },
      });
      if (!exists) return c.json({ error: "Card not found" }, 404);
      return c.json({ error: "Card is already cancelled" }, 422);
    }

    return c.json({ success: true });
  });
