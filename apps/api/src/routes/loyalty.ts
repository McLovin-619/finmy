import { db } from "@finmy/db";
import { loyalty, loyaltyTierEnum } from "@finmy/db/schema";
import { sessionMiddleware } from "@finmy/auth";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

type LoyaltyTier = (typeof loyaltyTierEnum.enumValues)[number];

export type TierDefinition = {
  key: LoyaltyTier;
  label: string;
  pointsRequired: number;
  cashbackPct: number;
  pointsMultiplier: number;
  feeDiscountPct: number;
  withdrawalLimitSar: number;
  exclusiveInvestments: boolean;
  dedicatedSupport: boolean;
};

// Canonical tier ladder. Ordered ascending by pointsRequired so the client can
// render the progression strip directly without re-sorting.
const TIERS: TierDefinition[] = [
  {
    key: "standard",
    label: "Standard",
    pointsRequired: 0,
    cashbackPct: 0.5,
    pointsMultiplier: 1,
    feeDiscountPct: 0,
    withdrawalLimitSar: 5_000,
    exclusiveInvestments: false,
    dedicatedSupport: false,
  },
  {
    key: "silver",
    label: "Silver",
    pointsRequired: 1_000,
    cashbackPct: 1,
    pointsMultiplier: 1.5,
    feeDiscountPct: 10,
    withdrawalLimitSar: 15_000,
    exclusiveInvestments: false,
    dedicatedSupport: false,
  },
  {
    key: "gold",
    label: "Gold",
    pointsRequired: 5_000,
    cashbackPct: 2,
    pointsMultiplier: 2,
    feeDiscountPct: 25,
    withdrawalLimitSar: 30_000,
    exclusiveInvestments: true,
    dedicatedSupport: false,
  },
  {
    key: "diamond",
    label: "Diamond",
    pointsRequired: 15_000,
    cashbackPct: 3,
    pointsMultiplier: 3,
    feeDiscountPct: 50,
    withdrawalLimitSar: 100_000,
    exclusiveInvestments: true,
    dedicatedSupport: true,
  },
];

const TIERS_BY_KEY = new Map(TIERS.map((t) => [t.key, t]));

export const loyaltyRoutes = new Hono()
  .use("*", sessionMiddleware)

  .get("/", async (c) => {
    const userId = c.get("user").id;

    const record = await db.query.loyalty.findFirst({
      where: eq(loyalty.userId, userId),
    });

    if (!record) return c.json({ error: "Loyalty record not found" }, 404);

    const currentTier = TIERS_BY_KEY.get(record.tier) ?? TIERS[0];

    return c.json({
      tier: record.tier,
      pointsBalance: record.pointsBalance,
      lifetimePoints: record.lifetimePoints,
      lifetimeDepositSar: record.lifetimeDepositHalalas / 100,
      lifetimeSpendSar: record.lifetimeSpendHalalas / 100,
      currentTier,
      tiers: TIERS,
      createdAt: record.createdAt.toISOString(),
    });
  })

  .get("/tiers", async (c) => {
    return c.json({ tiers: TIERS });
  });
