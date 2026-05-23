import { db } from "@finmy/db";
import { digitalWallets, transactions, users } from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";

const MIN_WITHDRAWAL_HALALAS = 1_00; // SAR 1.00

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

  // GET /api/wallet/transactions — cursor-paginated transaction history
  .get(
    "/transactions",
    zValidator(
      "query",
      z.object({
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(25),
        filter: z.enum(["all", "income", "expense"]).default("all"),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { cursor, limit, filter } = c.req.valid("query");

      const wallet = await db.query.digitalWallets.findFirst({
        where: eq(digitalWallets.userId, userId),
      });
      if (!wallet) return c.json({ error: "Wallet not found" }, 404);

      type TxType = "salary_payment" | "bonus" | "deduction" | "top_up" | "withdrawal" | "allowance_payment" | "investment_deduction" | "bill_payment" | "card_payment" | "transfer_out" | "transfer_in" | "stock_buy" | "stock_sell";
      const INCOME_TYPES: TxType[] = ["transfer_in", "top_up", "salary_payment", "bonus", "stock_sell"];
      const EXPENSE_TYPES: TxType[] = [
        "transfer_out", "withdrawal", "allowance_payment", "investment_deduction",
        "bill_payment", "card_payment", "deduction", "stock_buy",
      ];

      const conditions = [eq(transactions.walletId, wallet.id)];
      if (cursor) conditions.push(lt(transactions.occurredAt, new Date(cursor)));
      if (filter === "income") conditions.push(inArray(transactions.type, INCOME_TYPES));
      else if (filter === "expense") conditions.push(inArray(transactions.type, EXPENSE_TYPES));

      const rows = await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.occurredAt))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore ? page[page.length - 1].occurredAt.toISOString() : null;

      return c.json({
        transactions: page.map((t) => ({
          id: t.id,
          type: t.type,
          amountHalalas: t.amountHalalas,
          status: t.status,
          description: t.description,
          occurredAt: t.occurredAt,
          isCredit: INCOME_TYPES.includes(t.type),
        })),
        nextCursor,
        hasMore,
      });
    },
  )

  // GET /api/wallet/stream — SSE: live balance and new transaction events
  .get("/stream", async (c) => {
    const userId = c.get("user").id;

    const wallet = await db.query.digitalWallets.findFirst({
      where: eq(digitalWallets.userId, userId),
    });
    if (!wallet) return c.json({ error: "Wallet not found" }, 404);

    return streamSSE(c, async (stream) => {
      let lastBalanceHalalas = wallet.balanceHalalas;
      const latestTxn = await db
        .select({ occurredAt: transactions.occurredAt })
        .from(transactions)
        .where(eq(transactions.walletId, wallet.id))
        .orderBy(desc(transactions.occurredAt))
        .limit(1);
      // Seed from the most recent tx so we don't re-emit transactions that
      // already exist when the client connects.
      let lastSeenAt: Date = latestTxn[0]?.occurredAt ?? new Date();
      let lastWalletUpdatedAt: Date = wallet.updatedAt;
      let pingTick = 0;

      await stream.writeSSE({
        event: "connected",
        data: JSON.stringify({
          balanceSar: wallet.balanceHalalas / 100,
          currency: wallet.currency,
        }),
      });

      while (!stream.closed) {
        await stream.sleep(5_000);

        // Only re-fetch the wallet row when updatedAt advanced — skips the
        // SELECT entirely on ticks where nothing changed.
        const [changedWallet, newTxns] = await Promise.all([
          db
            .select({
              balanceHalalas: digitalWallets.balanceHalalas,
              updatedAt: digitalWallets.updatedAt,
            })
            .from(digitalWallets)
            .where(
              and(
                eq(digitalWallets.id, wallet.id),
                gt(digitalWallets.updatedAt, lastWalletUpdatedAt),
              ),
            )
            .limit(1)
            .then((rows) => rows[0] ?? null),
          db
            .select()
            .from(transactions)
            .where(and(eq(transactions.walletId, wallet.id), gt(transactions.occurredAt, lastSeenAt)))
            .orderBy(asc(transactions.occurredAt))
            .limit(20),
        ]);

        if (changedWallet && changedWallet.balanceHalalas !== lastBalanceHalalas) {
          lastBalanceHalalas = changedWallet.balanceHalalas;
          lastWalletUpdatedAt = changedWallet.updatedAt;
          await stream.writeSSE({
            event: "balance",
            data: JSON.stringify({ balanceSar: changedWallet.balanceHalalas / 100 }),
          });
        }

        for (const txn of newTxns) {
          await stream.writeSSE({
            event: "transaction",
            data: JSON.stringify({
              id: txn.id,
              type: txn.type,
              amountSar: txn.amountHalalas / 100,
              status: txn.status,
              description: txn.description,
              occurredAt: txn.occurredAt,
            }),
          });
          if (txn.occurredAt > lastSeenAt) lastSeenAt = txn.occurredAt;
        }

        // Keepalive every 30 s (6 ticks × 5 s) to prevent proxy timeouts
        if (++pingTick % 6 === 0) {
          await stream.writeSSE({ event: "ping", data: "" });
        }
      }
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

      const senderWallet = await db.query.digitalWallets.findFirst({
        where: eq(digitalWallets.userId, senderId),
      });
      if (!senderWallet) return c.json({ error: "Sender wallet not found" }, 404);
      if (senderWallet.balanceHalalas < amountHalalas) {
        return c.json({ error: "Insufficient balance" }, 422);
      }

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
  )

  // GET /api/wallet/transactions/:id — single transaction lookup
  .get("/transactions/:id", async (c) => {
    const userId = c.get("user").id;
    const txId = c.req.param("id");

    const wallet = await db.query.digitalWallets.findFirst({
      where: eq(digitalWallets.userId, userId),
    });
    if (!wallet) return c.json({ error: "Wallet not found" }, 404);

    const [txn] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, txId), eq(transactions.walletId, wallet.id)))
      .limit(1);

    if (!txn) return c.json({ error: "Transaction not found" }, 404);

    return c.json({
      id: txn.id,
      type: txn.type,
      amountSar: txn.amountHalalas / 100,
      status: txn.status,
      description: txn.description,
      peerWalletId: txn.peerWalletId,
      occurredAt: txn.occurredAt,
    });
  })

  // POST /api/wallet/withdraw — debit wallet (mock; no bank payout processor yet)
  .post(
    "/withdraw",
    zValidator(
      "json",
      z.object({
        amountSar: z.number().positive().multipleOf(0.01),
        description: z.string().max(200).optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { amountSar, description } = c.req.valid("json");
      const amountHalalas = Math.round(amountSar * 100);

      if (amountHalalas < MIN_WITHDRAWAL_HALALAS) {
        return c.json({ error: "Minimum withdrawal is SAR 1.00" }, 422);
      }

      const wallet = await db.query.digitalWallets.findFirst({
        where: eq(digitalWallets.userId, userId),
      });
      if (!wallet) return c.json({ error: "Wallet not found" }, 404);
      if (wallet.balanceHalalas < amountHalalas) {
        return c.json({ error: "Insufficient balance" }, 422);
      }

      await db.transaction(async (tx) => {
        await tx
          .update(digitalWallets)
          .set({ balanceHalalas: sql`${digitalWallets.balanceHalalas} - ${amountHalalas}` })
          .where(eq(digitalWallets.id, wallet.id));

        await tx.insert(transactions).values({
          walletId: wallet.id,
          type: "withdrawal",
          amountHalalas,
          status: "completed",
          description: description ?? "Withdrawal",
          occurredAt: new Date(),
        });
      });

      const updated = await db.query.digitalWallets.findFirst({
        where: eq(digitalWallets.id, wallet.id),
      });

      return c.json({
        success: true,
        newBalanceSar: (updated?.balanceHalalas ?? 0) / 100,
      });
    },
  )

  // POST /api/wallet/top-up — credit the wallet (mock payment; no payment processor yet)
  .post(
    "/top-up",
    zValidator(
      "json",
      z.object({
        amountSar: z.number().positive().multipleOf(0.01),
      }),
    ),
    async (c) => {
      const userId = c.get("user").id;
      const { amountSar } = c.req.valid("json");
      const amountHalalas = Math.round(amountSar * 100);

      const wallet = await db.query.digitalWallets.findFirst({
        where: eq(digitalWallets.userId, userId),
      });
      if (!wallet) return c.json({ error: "Wallet not found" }, 404);

      await db.transaction(async (tx) => {
        await tx
          .update(digitalWallets)
          .set({ balanceHalalas: sql`${digitalWallets.balanceHalalas} + ${amountHalalas}` })
          .where(eq(digitalWallets.id, wallet.id));

        await tx.insert(transactions).values({
          walletId: wallet.id,
          type: "top_up",
          amountHalalas,
          status: "completed",
          description: "Top up",
          occurredAt: new Date(),
        });
      });

      const updated = await db.query.digitalWallets.findFirst({
        where: eq(digitalWallets.id, wallet.id),
      });

      return c.json({
        success: true,
        newBalanceSar: (updated?.balanceHalalas ?? 0) / 100,
      });
    },
  );
