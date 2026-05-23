import { db } from "@finmy/db";
import {
  auditLogs,
  digitalWallets,
  stockHoldings,
  stockOrders,
  transactions,
} from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import {
  WATCHLIST,
  getHistory,
  getQuote,
  getQuotes,
  getWatchlistMeta,
  isWatchlistSymbol,
} from "../services/stocks";

const SHARES_MICRO = 1_000_000;
// Convert a SAR halalas notional + per-share halalas price to fractional micro-shares.
function sarToSharesMicro(amountHalalas: number, priceHalalas: number): number {
  return Math.floor((amountHalalas * SHARES_MICRO) / priceHalalas);
}
function sharesMicroToSar(sharesMicro: number, priceHalalas: number): number {
  return Math.floor((sharesMicro * priceHalalas) / SHARES_MICRO);
}

const orderSchema = z
  .object({
    symbol: z.string().min(1),
    side: z.enum(["buy", "sell"]),
    amountSar: z.number().positive().multipleOf(0.01),
  })
  .refine((d) => isWatchlistSymbol(d.symbol), { message: "Symbol not in watchlist" });

const historyRange = z.enum(["1M", "3M", "6M", "1Y"]);
const RANGE_DAYS: Record<z.infer<typeof historyRange>, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
};

export const stockRoutes = new Hono()
  .use("*", sessionMiddleware)

  // GET /api/stocks/watchlist — curated list with live quotes
  .get("/watchlist", async (c) => {
    try {
      const quotes = await getQuotes(WATCHLIST.map((w) => w.symbol));
      return c.json({ quotes });
    } catch (err) {
      console.error("yahoo quote failed", err);
      return c.json({ error: "Market data unavailable" }, 503);
    }
  })

  // GET /api/stocks/holdings — user holdings enriched with live price + P/L
  .get("/holdings", async (c) => {
    const userId = c.get("user").id;

    const rows = await db
      .select()
      .from(stockHoldings)
      .where(eq(stockHoldings.userId, userId));

    if (rows.length === 0) {
      return c.json({ holdings: [], totalValueHalalas: 0, totalCostHalalas: 0 });
    }

    let quotes: Awaited<ReturnType<typeof getQuotes>> = [];
    try {
      quotes = await getQuotes(rows.map((r) => r.symbol));
    } catch (err) {
      console.error("yahoo quote failed for holdings", err);
    }
    const quoteBySymbol = new Map(quotes.map((q) => [q.symbol, q]));

    let totalValueHalalas = 0;
    let totalCostHalalas = 0;

    const holdings = rows.map((r) => {
      const q = quoteBySymbol.get(r.symbol);
      const meta = getWatchlistMeta(r.symbol);
      const priceHalalas = q?.priceHalalas ?? r.avgCostHalalas;
      const valueHalalas = sharesMicroToSar(r.sharesMicro, priceHalalas);
      const costHalalas = sharesMicroToSar(r.sharesMicro, r.avgCostHalalas);
      totalValueHalalas += valueHalalas;
      totalCostHalalas += costHalalas;
      return {
        symbol: r.symbol,
        name: meta?.name ?? r.symbol,
        exchange: meta?.exchange ?? "",
        sharesMicro: r.sharesMicro,
        avgCostHalalas: r.avgCostHalalas,
        priceHalalas,
        valueHalalas,
        costHalalas,
        unrealizedPlHalalas: valueHalalas - costHalalas,
        unrealizedPlPct: costHalalas > 0 ? ((valueHalalas - costHalalas) / costHalalas) * 100 : 0,
        dayChangePct: q?.changePct ?? 0,
      };
    });

    return c.json({
      holdings,
      totalValueHalalas,
      totalCostHalalas,
      totalUnrealizedPlHalalas: totalValueHalalas - totalCostHalalas,
    });
  })

  // GET /api/stocks/orders — recent trade history for the user
  .get("/orders", async (c) => {
    const userId = c.get("user").id;
    const rows = await db
      .select()
      .from(stockOrders)
      .where(eq(stockOrders.userId, userId))
      .orderBy(desc(stockOrders.executedAt))
      .limit(50);

    return c.json({
      orders: rows.map((r) => ({
        id: r.id,
        symbol: r.symbol,
        side: r.side,
        sharesMicro: r.sharesMicro,
        priceHalalas: r.priceHalalas,
        amountHalalas: r.amountHalalas,
        executedAt: r.executedAt.toISOString(),
      })),
    });
  })

  // GET /api/stocks/:symbol — quote + history for a single ticker
  .get(
    "/:symbol",
    zValidator(
      "query",
      z.object({ range: historyRange.default("1M") }),
    ),
    async (c) => {
      const symbol = c.req.param("symbol");
      if (!isWatchlistSymbol(symbol)) {
        return c.json({ error: "Symbol not in watchlist" }, 404);
      }
      const { range } = c.req.valid("query");

      try {
        const [quote, history] = await Promise.all([
          getQuote(symbol),
          getHistory(symbol, RANGE_DAYS[range]),
        ]);
        if (!quote) return c.json({ error: "Quote unavailable" }, 503);
        return c.json({ quote, history, range });
      } catch (err) {
        console.error("yahoo quote/history failed", err);
        return c.json({ error: "Market data unavailable" }, 503);
      }
    },
  )

  // POST /api/stocks/orders — execute a buy or sell at the live quote
  .post("/orders", zValidator("json", orderSchema), async (c) => {
    const userId = c.get("user").id;
    const { symbol, side, amountSar } = c.req.valid("json");
    const amountHalalas = Math.round(amountSar * 100);

    const quote = await getQuote(symbol).catch(() => null);
    if (!quote || quote.priceHalalas <= 0) {
      return c.json({ error: "Live quote unavailable, try again" }, 503);
    }
    const priceHalalas = quote.priceHalalas;

    const wallet = await db.query.digitalWallets.findFirst({
      where: eq(digitalWallets.userId, userId),
    });
    if (!wallet) return c.json({ error: "Wallet not found" }, 404);

    const existingHolding = await db.query.stockHoldings.findFirst({
      where: and(eq(stockHoldings.userId, userId), eq(stockHoldings.symbol, symbol)),
    });

    const sharesMicroDelta = sarToSharesMicro(amountHalalas, priceHalalas);
    if (sharesMicroDelta <= 0) {
      return c.json({ error: "Amount too small for one micro-share" }, 422);
    }

    if (side === "buy" && wallet.balanceHalalas < amountHalalas) {
      return c.json({ error: "Insufficient wallet balance" }, 422);
    }
    if (side === "sell" && (!existingHolding || existingHolding.sharesMicro < sharesMicroDelta)) {
      return c.json({ error: "Not enough shares to sell" }, 422);
    }

    const now = new Date();
    const ipAddress = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? null;
    const userAgent = c.req.header("user-agent") ?? null;

    const result = await db.transaction(async (tx) => {
      if (side === "buy") {
        // Atomic balance check + debit — gte() guard inside the same statement
        // blocks double-spend if two orders race.
        const [updatedWallet] = await tx
          .update(digitalWallets)
          .set({
            balanceHalalas: sql<number>`${digitalWallets.balanceHalalas} - ${amountHalalas}`,
            updatedAt: now,
          })
          .where(
            and(
              eq(digitalWallets.id, wallet.id),
              gte(digitalWallets.balanceHalalas, amountHalalas),
            ),
          )
          .returning();
        if (!updatedWallet) throw new Error("INSUFFICIENT_BALANCE");

        if (existingHolding) {
          const newShares = existingHolding.sharesMicro + sharesMicroDelta;
          // Weighted average cost: blend old cost basis with new buy price.
          const newAvg = Math.round(
            (existingHolding.sharesMicro * existingHolding.avgCostHalalas +
              sharesMicroDelta * priceHalalas) /
              newShares,
          );
          await tx
            .update(stockHoldings)
            .set({ sharesMicro: newShares, avgCostHalalas: newAvg, updatedAt: now })
            .where(eq(stockHoldings.id, existingHolding.id));
        } else {
          await tx.insert(stockHoldings).values({
            userId,
            symbol,
            sharesMicro: sharesMicroDelta,
            avgCostHalalas: priceHalalas,
          });
        }
      } else {
        // SELL — credit wallet, reduce or delete holding
        await tx
          .update(digitalWallets)
          .set({
            balanceHalalas: sql<number>`${digitalWallets.balanceHalalas} + ${amountHalalas}`,
            updatedAt: now,
          })
          .where(eq(digitalWallets.id, wallet.id));

        const remaining = existingHolding!.sharesMicro - sharesMicroDelta;
        if (remaining <= 0) {
          await tx.delete(stockHoldings).where(eq(stockHoldings.id, existingHolding!.id));
        } else {
          await tx
            .update(stockHoldings)
            .set({ sharesMicro: remaining, updatedAt: now })
            .where(eq(stockHoldings.id, existingHolding!.id));
        }
      }

      const [order] = await tx
        .insert(stockOrders)
        .values({
          userId,
          symbol,
          side,
          sharesMicro: sharesMicroDelta,
          priceHalalas,
          amountHalalas,
          executedAt: now,
        })
        .returning();

      await tx.insert(transactions).values({
        walletId: wallet.id,
        type: side === "buy" ? "stock_buy" : "stock_sell",
        amountHalalas,
        status: "completed",
        description: `${side === "buy" ? "Buy" : "Sell"} ${symbol} · ${(
          sharesMicroDelta / SHARES_MICRO
        ).toFixed(4)} sh @ SAR ${(priceHalalas / 100).toFixed(2)}`,
        occurredAt: now,
      });

      await tx.insert(auditLogs).values({
        actorId: userId,
        action: side === "buy" ? "stock.buy" : "stock.sell",
        targetType: "stock_orders",
        targetId: order.id,
        beforeState: existingHolding
          ? {
              sharesMicro: existingHolding.sharesMicro,
              avgCostHalalas: existingHolding.avgCostHalalas,
              walletBalanceHalalas: wallet.balanceHalalas,
            }
          : { walletBalanceHalalas: wallet.balanceHalalas },
        afterState: {
          symbol,
          sharesMicroDelta,
          priceHalalas,
          amountHalalas,
        },
        ipAddress,
        userAgent,
        createdAt: now,
      });

      return order;
    });

    return c.json({
      success: true,
      order: {
        id: result.id,
        symbol: result.symbol,
        side: result.side,
        sharesMicro: result.sharesMicro,
        priceHalalas: result.priceHalalas,
        amountHalalas: result.amountHalalas,
        executedAt: result.executedAt.toISOString(),
      },
    });
  });
