import { db } from "@finmy/db";
import { digitalWallets, transactions, users } from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

export const walletRoutes = new Hono()
  .use("*", sessionMiddleware)

  // GET /api/wallet — balance + recent transactions
  .get("/", async (c) => {
    const userId = c.get("user").id;

    const wallet = await db.query.digitalWallets.findFirst({
      where: eq(digitalWallets.userId, userId),
    });
    if (!wallet) return c.json({ error: "Wallet not found" }, 404);

    const txns = await db
      .select()
      .from(transactions)
      .where(eq(transactions.walletId, wallet.id))
      .orderBy(desc(transactions.occurredAt))
      .limit(50);

    return c.json({
      wallet: {
        id: wallet.id,
        iban: wallet.iban,
        balanceSar: wallet.balanceHalalas / 100,
        currency: wallet.currency,
      },
      transactions: txns.map((t) => ({
        id: t.id,
        type: t.type,
        amountSar: t.amountHalalas / 100,
        status: t.status,
        description: t.description,
        peerWalletId: t.peerWalletId,
        occurredAt: t.occurredAt,
      })),
    });
  })

  // POST /api/wallet/send — transfer to another finmy user by email or IBAN
  .post(
    "/send",
    zValidator(
      "json",
      z.object({
        toEmail: z.string().email().optional(),
        toIban: z.string().optional(),
        amountSar: z.number().positive().multipleOf(0.01),
        description: z.string().max(200).optional(),
      }).refine((d) => d.toEmail || d.toIban, {
        message: "Provide toEmail or toIban",
      }),
    ),
    async (c) => {
      const senderId = c.get("user").id;
      const { toEmail, toIban, amountSar, description } = c.req.valid("json");
      const amountHalalas = Math.round(amountSar * 100);

      // Resolve sender wallet
      const senderWallet = await db.query.digitalWallets.findFirst({
        where: eq(digitalWallets.userId, senderId),
      });
      if (!senderWallet) return c.json({ error: "Sender wallet not found" }, 404);
      if (senderWallet.balanceHalalas < amountHalalas) {
        return c.json({ error: "Insufficient balance" }, 422);
      }

      // Resolve receiver wallet
      let receiverWallet;
      if (toIban) {
        receiverWallet = await db.query.digitalWallets.findFirst({
          where: eq(digitalWallets.iban, toIban),
        });
      } else {
        const receiverUser = await db.query.users.findFirst({
          where: eq(users.email, toEmail!),
        });
        if (receiverUser) {
          receiverWallet = await db.query.digitalWallets.findFirst({
            where: eq(digitalWallets.userId, receiverUser.id),
          });
        }
      }
      if (!receiverWallet) return c.json({ error: "Recipient not found" }, 404);
      if (receiverWallet.id === senderWallet.id) {
        return c.json({ error: "Cannot send to yourself" }, 422);
      }

      // Atomic transfer — debit sender, credit receiver, create both transaction rows
      await db.transaction(async (tx) => {
        await tx
          .update(digitalWallets)
          .set({ balanceHalalas: sql`${digitalWallets.balanceHalalas} - ${amountHalalas}` })
          .where(eq(digitalWallets.id, senderWallet.id));

        await tx
          .update(digitalWallets)
          .set({ balanceHalalas: sql`${digitalWallets.balanceHalalas} + ${amountHalalas}` })
          .where(eq(digitalWallets.id, receiverWallet!.id));

        const now = new Date();
        await tx.insert(transactions).values([
          {
            walletId: senderWallet.id,
            type: "transfer_out",
            amountHalalas,
            status: "completed",
            peerWalletId: receiverWallet!.id,
            description: description ?? null,
            occurredAt: now,
          },
          {
            walletId: receiverWallet!.id,
            type: "transfer_in",
            amountHalalas,
            status: "completed",
            peerWalletId: senderWallet.id,
            description: description ?? null,
            occurredAt: now,
          },
        ]);
      });

      // Return updated sender balance
      const updated = await db.query.digitalWallets.findFirst({
        where: eq(digitalWallets.id, senderWallet.id),
      });

      return c.json({
        success: true,
        newBalanceSar: (updated?.balanceHalalas ?? 0) / 100,
      });
    },
  );
