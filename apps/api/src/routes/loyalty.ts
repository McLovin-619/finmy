import { db } from "@finmy/db";
import { loyalty, loyaltyTierEnum } from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

type LoyaltyTier = (typeof loyaltyTierEnum.enumValues)[number];

const TIER_BENEFITS: Record<
  LoyaltyTier,
  { adminFeeDiscount: number; cashbackPct: number; withdrawalLimitSar: number }
> = {
  standard: { adminFeeDiscount: 0, cashbackPct: 0, withdrawalLimitSar: 5000 },
  silver: { adminFeeDiscount: 10, cashbackPct: 0.5, withdrawalLimitSar: 10000 },
  gold: { adminFeeDiscount: 20, cashbackPct: 1.0, withdrawalLimitSar: 20000 },
  diamond: { adminFeeDiscount: 35, cashbackPct: 2.0, withdrawalLimitSar: 50000 },
};

export const loyaltyRoutes = new Hono()
  .use("*", sessionMiddleware)

  // GET /api/loyalty — fetch loyalty record for the authenticated user
  .get("/", async (c) => {
    const userId = c.get("user").id;

    const record = await db.query.loyalty.findFirst({
      where: eq(loyalty.userId, userId),
    });

    if (!record) return c.json({ error: "Loyalty record not found" }, 404);

    return c.json({
      tier: record.tier,
      pointsBalance: record.pointsBalance,
      lifetimePoints: record.lifetimePoints,
      lifetimeDepositSar: record.lifetimeDepositHalalas / 100,
      lifetimeSpendSar: record.lifetimeSpendHalalas / 100,
      tierBenefits: TIER_BENEFITS[record.tier],
      createdAt: record.createdAt.toISOString(),
    });
  });
