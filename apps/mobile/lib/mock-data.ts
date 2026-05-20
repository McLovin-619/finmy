// ─── Allowances ───────────────────────────────────────────────────────────────

export type AllowanceFrequency = "daily" | "weekly" | "monthly";
export type AllowanceRelation = "Son" | "Daughter" | "Staff" | "Other";
export type AllowanceStatus = "active" | "paused";

export type Allowance = {
  id: string;
  name: string;
  relation: AllowanceRelation;
  initials: string;
  color: string;
  handle: string;
  amountSar: number;
  frequency: AllowanceFrequency;
  dayLabel: string;
  status: AllowanceStatus;
  totalSentSar: number;
};

export const MOCK_ALLOWANCES: Allowance[] = [
  {
    id: "al1",
    name: "Khalid",
    relation: "Son",
    initials: "Kh",
    color: "#7C3AED",
    handle: "@khalid",
    amountSar: 200,
    frequency: "weekly",
    dayLabel: "Every Sunday",
    status: "active",
    totalSentSar: 2_400,
  },
  {
    id: "al2",
    name: "Noura",
    relation: "Daughter",
    initials: "Nr",
    color: "#EC4899",
    handle: "@noura",
    amountSar: 200,
    frequency: "weekly",
    dayLabel: "Every Sunday",
    status: "active",
    totalSentSar: 1_800,
  },
  {
    id: "al3",
    name: "Ahmad",
    relation: "Staff",
    initials: "Ah",
    color: "#10B981",
    handle: "+966 50 123 4567",
    amountSar: 1_500,
    frequency: "monthly",
    dayLabel: "1st of every month",
    status: "active",
    totalSentSar: 6_000,
  },
  {
    id: "al4",
    name: "Fatima",
    relation: "Staff",
    initials: "Fm",
    color: "#F59E0B",
    handle: "+966 55 987 6543",
    amountSar: 1_200,
    frequency: "monthly",
    dayLabel: "1st of every month",
    status: "paused",
    totalSentSar: 3_600,
  },
];

export type OwnAccount = {
  id: string;
  label: string;
  number: string;
  balance: string;
  type: "main" | "savings" | "investment";
};

export const MOCK_OWN_ACCOUNTS: OwnAccount[] = [
  { id: "a1", label: "Main Account", number: "•••• 3456", balance: "SAR 12,450.00", type: "main" },
  {
    id: "a2",
    label: "Savings Account",
    number: "•••• 7891",
    balance: "SAR 28,780.00",
    type: "savings",
  },
  {
    id: "a3",
    label: "Investment Account",
    number: "•••• 2210",
    balance: "SAR 4,000.00",
    type: "investment",
  },
];

export type Contact = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  color: string;
};

export const MOCK_CONTACTS: Contact[] = [
  { id: "c1", name: "Sara Al-Otaibi", handle: "@sara.o", initials: "SA", color: "#7C3AED" },
  { id: "c2", name: "Mohammed Khalid", handle: "@mkhalid", initials: "MK", color: "#EC4899" },
  { id: "c3", name: "Nour Al-Rashid", handle: "@nour.r", initials: "NR", color: "#3B82F6" },
  { id: "c4", name: "Faisal Al-Harbi", handle: "@fharbi", initials: "FH", color: "#10B981" },
  { id: "c5", name: "Lina Mahmoud", handle: "@lina.m", initials: "LM", color: "#F59E0B" },
  { id: "c6", name: "Omar Qureshi", handle: "@omar.q", initials: "OQ", color: "#EF4444" },
];

export type SubscriptionCategory =
  | "entertainment"
  | "productivity"
  | "health"
  | "shopping"
  | "food"
  | "finance";
export type SubscriptionCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "paused";

export type Subscription = {
  id: string;
  name: string;
  initials: string;
  color: string;
  category: SubscriptionCategory;
  amountSar: number;
  cycle: SubscriptionCycle;
  nextBillingDay: number; // day of month
  status: SubscriptionStatus;
};

// ─── Loyalty ──────────────────────────────────────────────────────────────────

export type TierName = "Standard" | "Silver" | "Gold" | "Diamond";

export type Tier = {
  name: TierName;
  icon: string;
  colors: [string, string];
  pointsRequired: number;
  cashbackPct: number;
  feeDiscountPct: number;
  withdrawalLimitSar: number;
  pointsMultiplier: number;
  exclusiveInvestments: boolean;
  dedicatedSupport: boolean;
};

export type PointsActivity = {
  id: string;
  description: string;
  points: number; // positive = earned, negative = redeemed
  date: string;
};

export const MOCK_TIERS: Tier[] = [
  {
    name: "Standard",
    icon: "ribbon-outline",
    colors: ["#9CA3AF", "#6B7280"],
    pointsRequired: 0,
    cashbackPct: 0.5,
    feeDiscountPct: 0,
    withdrawalLimitSar: 5_000,
    pointsMultiplier: 1,
    exclusiveInvestments: false,
    dedicatedSupport: false,
  },
  {
    name: "Silver",
    icon: "star-outline",
    colors: ["#94A3B8", "#64748B"],
    pointsRequired: 1_000,
    cashbackPct: 1,
    feeDiscountPct: 10,
    withdrawalLimitSar: 15_000,
    pointsMultiplier: 1.5,
    exclusiveInvestments: false,
    dedicatedSupport: false,
  },
  {
    name: "Gold",
    icon: "trophy-outline",
    colors: ["#F59E0B", "#D97706"],
    pointsRequired: 5_000,
    cashbackPct: 2,
    feeDiscountPct: 25,
    withdrawalLimitSar: 30_000,
    pointsMultiplier: 2,
    exclusiveInvestments: true,
    dedicatedSupport: false,
  },
  {
    name: "Diamond",
    icon: "sparkles-outline",
    colors: ["#7C3AED", "#EC4899"],
    pointsRequired: 15_000,
    cashbackPct: 3,
    feeDiscountPct: 50,
    withdrawalLimitSar: 100_000,
    pointsMultiplier: 3,
    exclusiveInvestments: true,
    dedicatedSupport: true,
  },
];

export const MOCK_LOYALTY = {
  currentTier: "Silver" as TierName,
  totalPoints: 2_450,
  pointsThisMonth: 340,
  cashbackEarnedSar: 142,
};

export const MOCK_POINTS_ACTIVITY: PointsActivity[] = [
  { id: "pa1", description: "Card spend · Tabby", points: +34, date: "Today" },
  { id: "pa2", description: "Auto-Investment deposit", points: +200, date: "Yesterday" },
  { id: "pa3", description: "Bill payment · STC", points: +15, date: "23 May" },
  { id: "pa4", description: "Top up · SAR 500", points: +75, date: "20 May" },
  { id: "pa5", description: "Gift card redemption", points: -500, date: "18 May" },
  { id: "pa6", description: "Card spend · Amazon", points: +52, date: "15 May" },
];

// ─── Cards ────────────────────────────────────────────────────────────────────

export type CardNetwork = "mada" | "visa" | "mastercard" | "travel";
export type CardFormat = "virtual" | "physical";
export type CardStatus = "active" | "frozen";

export type IssuedCard = {
  id: string;
  network: CardNetwork;
  format: CardFormat;
  label: string;
  lastFour: string;
  expiry: string;
  status: CardStatus;
  spendLimitSar: number;
  spentThisMonthSar: number;
  onlinePayments: boolean;
  contactless: boolean;
  internationalTx: boolean;
  gradientColors: [string, string];
};

export const MOCK_CARDS: IssuedCard[] = [
  {
    id: "card1",
    network: "mada",
    format: "virtual",
    label: "mada",
    lastFour: "3456",
    expiry: "08/27",
    status: "active",
    spendLimitSar: 5_000,
    spentThisMonthSar: 1_240,
    onlinePayments: true,
    contactless: true,
    internationalTx: false,
    gradientColors: ["#7C3AED", "#5B21B6"],
  },
  {
    id: "card2",
    network: "visa",
    format: "physical",
    label: "VISA",
    lastFour: "7891",
    expiry: "03/26",
    status: "active",
    spendLimitSar: 15_000,
    spentThisMonthSar: 3_420,
    onlinePayments: true,
    contactless: true,
    internationalTx: true,
    gradientColors: ["#1A1426", "#374151"],
  },
  {
    id: "card3",
    network: "travel",
    format: "virtual",
    label: "Travel",
    lastFour: "2210",
    expiry: "11/28",
    status: "frozen",
    spendLimitSar: 10_000,
    spentThisMonthSar: 890,
    onlinePayments: true,
    contactless: false,
    internationalTx: true,
    gradientColors: ["#0EA5E9", "#14B8A6"],
  },
];

// ─── Investments ──────────────────────────────────────────────────────────────

export type InvestmentSector = {
  id: string;
  name: string;
  icon: string;
  color: string;
  allocationPct: number;
  valueSar: number;
  returnPct: number;
};

export type PortfolioDataPoint = { label: string; valueSar: number };

export const MOCK_PORTFOLIO = {
  totalInvestedSar: 11_680,
  totalValueSar: 13_130,
  gainSar: 1_450,
  gainPct: 12.4,
  monthlyDeductionSar: 500,
  nextDeductionDay: 25,
  paused: false,
};

export const MOCK_PORTFOLIO_HISTORY: PortfolioDataPoint[] = [
  { label: "Jun", valueSar: 8_000 },
  { label: "Jul", valueSar: 8_540 },
  { label: "Aug", valueSar: 9_200 },
  { label: "Sep", valueSar: 9_820 },
  { label: "Oct", valueSar: 10_200 },
  { label: "Nov", valueSar: 10_850 },
  { label: "Dec", valueSar: 11_100 },
  { label: "Jan", valueSar: 10_900 },
  { label: "Feb", valueSar: 11_400 },
  { label: "Mar", valueSar: 11_800 },
  { label: "Apr", valueSar: 12_300 },
  { label: "May", valueSar: 13_130 },
];

export const MOCK_SECTORS: InvestmentSector[] = [
  {
    id: "i1",
    name: "US Stocks",
    icon: "trending-up-outline",
    color: "#7C3AED",
    allocationPct: 40,
    valueSar: 5_252,
    returnPct: 18.2,
  },
  {
    id: "i2",
    name: "Saudi Equities",
    icon: "bar-chart-outline",
    color: "#EC4899",
    allocationPct: 25,
    valueSar: 3_282,
    returnPct: 9.4,
  },
  {
    id: "i3",
    name: "Real Estate",
    icon: "business-outline",
    color: "#3B82F6",
    allocationPct: 20,
    valueSar: 2_626,
    returnPct: 7.1,
  },
  {
    id: "i4",
    name: "Sukuk",
    icon: "shield-checkmark-outline",
    color: "#10B981",
    allocationPct: 10,
    valueSar: 1_313,
    returnPct: 5.8,
  },
  {
    id: "i5",
    name: "Gold",
    icon: "sparkles-outline",
    color: "#F59E0B",
    allocationPct: 5,
    valueSar: 657,
    returnPct: 4.2,
  },
];

export type BillCategory =
  | "rent"
  | "utilities"
  | "bnpl"
  | "telecom"
  | "insurance"
  | "education"
  | "other";
export type BillStatus = "overdue" | "due-soon" | "upcoming" | "paid";

export type Bill = {
  id: string;
  name: string;
  abbr: string;
  color: string;
  category: BillCategory;
  amountSar: number;
  daysUntilDue: number; // negative = overdue
  status: BillStatus;
  autoPay: boolean;
  recurring: boolean;
  installment?: { paid: number; total: number };
};

export const MOCK_BILLS: Bill[] = [
  {
    id: "b1",
    name: "SADAD Electricity",
    abbr: "Ec",
    color: "#F59E0B",
    category: "utilities",
    amountSar: 186,
    daysUntilDue: -2,
    status: "overdue",
    autoPay: false,
    recurring: true,
  },
  {
    id: "b2",
    name: "Tabby",
    abbr: "Tb",
    color: "#3B82F6",
    category: "bnpl",
    amountSar: 340,
    daysUntilDue: 1,
    status: "due-soon",
    autoPay: false,
    recurring: false,
    installment: { paid: 1, total: 4 },
  },
  {
    id: "b3",
    name: "STC Broadband",
    abbr: "St",
    color: "#8B5CF6",
    category: "telecom",
    amountSar: 299,
    daysUntilDue: 3,
    status: "due-soon",
    autoPay: true,
    recurring: true,
  },
  {
    id: "b4",
    name: "Tamara",
    abbr: "Tm",
    color: "#10B981",
    category: "bnpl",
    amountSar: 150,
    daysUntilDue: 5,
    status: "upcoming",
    autoPay: false,
    recurring: false,
    installment: { paid: 0, total: 3 },
  },
  {
    id: "b5",
    name: "Al-Akaria Rent",
    abbr: "Rn",
    color: "#EC4899",
    category: "rent",
    amountSar: 2500,
    daysUntilDue: 12,
    status: "upcoming",
    autoPay: true,
    recurring: true,
  },
  {
    id: "b6",
    name: "Tawuniya Insurance",
    abbr: "Tw",
    color: "#EF4444",
    category: "insurance",
    amountSar: 450,
    daysUntilDue: 18,
    status: "upcoming",
    autoPay: false,
    recurring: true,
  },
  {
    id: "b7",
    name: "Zain Mobile",
    abbr: "Zn",
    color: "#14B8A6",
    category: "telecom",
    amountSar: 99,
    daysUntilDue: 22,
    status: "upcoming",
    autoPay: true,
    recurring: true,
  },
  {
    id: "b8",
    name: "NWC Water",
    abbr: "Wt",
    color: "#0EA5E9",
    category: "utilities",
    amountSar: 72,
    daysUntilDue: 0,
    status: "paid",
    autoPay: true,
    recurring: true,
  },
];

// ─── Reports ──────────────────────────────────────────────────────────────────

export type SpendCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  amountSar: number;
  pct: number; // share of total spend
  changePct: number; // vs previous month, positive = more spend
};

export type AiTip = {
  id: string;
  icon: string;
  title: string;
  body: string;
  savingSar?: number;
};

export type MonthlyReport = {
  id: string;
  monthLabel: string; // "May 2026"
  totalSpendSar: number;
  prevMonthSpendSar: number;
  incomeSar: number;
  savingsSar: number;
  categories: SpendCategory[];
  aiTips: AiTip[];
  aiSummary: string;
};

export const MOCK_REPORTS: MonthlyReport[] = [
  {
    id: "r1",
    monthLabel: "May 2026",
    totalSpendSar: 8_340,
    prevMonthSpendSar: 7_120,
    incomeSar: 18_500,
    savingsSar: 10_160,
    categories: [
      {
        id: "cat1",
        name: "Food & Dining",
        icon: "restaurant-outline",
        color: "#F97316",
        amountSar: 2_180,
        pct: 26,
        changePct: +18,
      },
      {
        id: "cat2",
        name: "Shopping",
        icon: "bag-outline",
        color: "#EC4899",
        amountSar: 1_640,
        pct: 20,
        changePct: +5,
      },
      {
        id: "cat3",
        name: "Rent & Housing",
        icon: "home-outline",
        color: "#3B82F6",
        amountSar: 2_500,
        pct: 30,
        changePct: 0,
      },
      {
        id: "cat4",
        name: "Subscriptions",
        icon: "repeat-outline",
        color: "#8B5CF6",
        amountSar: 508,
        pct: 6,
        changePct: -3,
      },
      {
        id: "cat5",
        name: "Transport",
        icon: "car-outline",
        color: "#10B981",
        amountSar: 612,
        pct: 7,
        changePct: +12,
      },
      {
        id: "cat6",
        name: "Health & Fitness",
        icon: "fitness-outline",
        color: "#EF4444",
        amountSar: 400,
        pct: 5,
        changePct: 0,
      },
      {
        id: "cat7",
        name: "Other",
        icon: "ellipsis-horizontal-outline",
        color: "#9CA3AF",
        amountSar: 500,
        pct: 6,
        changePct: -8,
      },
    ],
    aiTips: [
      {
        id: "t1",
        icon: "restaurant-outline",
        title: "Food spend up 18%",
        body: "You ordered delivery 23 times this month — 8 more than April. Cooking 3 meals a week at home could save roughly SAR 360 monthly.",
        savingSar: 360,
      },
      {
        id: "t2",
        icon: "car-outline",
        title: "Transport spike",
        body: "Ride-hailing charges jumped SAR 74 vs last month. Consider a monthly Uber Pass if you use it more than 12 times — it pays off at your current rate.",
        savingSar: 74,
      },
      {
        id: "t3",
        icon: "repeat-outline",
        title: "Unused subscription",
        body: "Adobe CC (SAR 344/mo) has had zero card activity in the last 47 days. Pausing it until you next need it would save SAR 344 next month.",
        savingSar: 344,
      },
    ],
    aiSummary:
      "You spent SAR 1,220 more than April — a 17% increase driven mostly by food delivery and transport. Your rent and subscriptions stayed steady. With a few small habit changes you could recover SAR 778 next month.",
  },
  {
    id: "r2",
    monthLabel: "Apr 2026",
    totalSpendSar: 7_120,
    prevMonthSpendSar: 7_540,
    incomeSar: 18_500,
    savingsSar: 11_380,
    categories: [
      {
        id: "cat1",
        name: "Food & Dining",
        icon: "restaurant-outline",
        color: "#F97316",
        amountSar: 1_850,
        pct: 26,
        changePct: -5,
      },
      {
        id: "cat2",
        name: "Shopping",
        icon: "bag-outline",
        color: "#EC4899",
        amountSar: 1_560,
        pct: 22,
        changePct: -10,
      },
      {
        id: "cat3",
        name: "Rent & Housing",
        icon: "home-outline",
        color: "#3B82F6",
        amountSar: 2_500,
        pct: 35,
        changePct: 0,
      },
      {
        id: "cat4",
        name: "Subscriptions",
        icon: "repeat-outline",
        color: "#8B5CF6",
        amountSar: 524,
        pct: 7,
        changePct: 0,
      },
      {
        id: "cat5",
        name: "Transport",
        icon: "car-outline",
        color: "#10B981",
        amountSar: 546,
        pct: 8,
        changePct: -8,
      },
      {
        id: "cat6",
        name: "Health & Fitness",
        icon: "fitness-outline",
        color: "#EF4444",
        amountSar: 400,
        pct: 6,
        changePct: 0,
      },
      {
        id: "cat7",
        name: "Other",
        icon: "ellipsis-horizontal-outline",
        color: "#9CA3AF",
        amountSar: 740,
        pct: 10,
        changePct: +4,
      },
    ],
    aiTips: [
      {
        id: "t1",
        icon: "bag-outline",
        title: "Good month for shopping",
        body: "Shopping spend dropped SAR 190 vs March. Sticking to your current habits here will save you an estimated SAR 2,280 over the year.",
      },
      {
        id: "t2",
        icon: "ellipsis-horizontal-outline",
        title: "Uncategorised spend",
        body: "SAR 740 landed in 'Other' — mostly small contactless payments. Linking your card statements lets finmy tag these automatically.",
      },
    ],
    aiSummary:
      "April was your most disciplined month in the last quarter. Total spend dropped SAR 420 vs March, led by lower food and shopping. Keep this pace in May and you will hit your SAR 50k savings milestone 3 weeks early.",
  },
  {
    id: "r3",
    monthLabel: "Mar 2026",
    totalSpendSar: 7_540,
    prevMonthSpendSar: 6_980,
    incomeSar: 18_500,
    savingsSar: 10_960,
    categories: [
      {
        id: "cat1",
        name: "Food & Dining",
        icon: "restaurant-outline",
        color: "#F97316",
        amountSar: 1_950,
        pct: 26,
        changePct: +8,
      },
      {
        id: "cat2",
        name: "Shopping",
        icon: "bag-outline",
        color: "#EC4899",
        amountSar: 1_750,
        pct: 23,
        changePct: +14,
      },
      {
        id: "cat3",
        name: "Rent & Housing",
        icon: "home-outline",
        color: "#3B82F6",
        amountSar: 2_500,
        pct: 33,
        changePct: 0,
      },
      {
        id: "cat4",
        name: "Subscriptions",
        icon: "repeat-outline",
        color: "#8B5CF6",
        amountSar: 524,
        pct: 7,
        changePct: 0,
      },
      {
        id: "cat5",
        name: "Transport",
        icon: "car-outline",
        color: "#10B981",
        amountSar: 594,
        pct: 8,
        changePct: +5,
      },
      {
        id: "cat6",
        name: "Health & Fitness",
        icon: "fitness-outline",
        color: "#EF4444",
        amountSar: 400,
        pct: 5,
        changePct: 0,
      },
      {
        id: "cat7",
        name: "Other",
        icon: "ellipsis-horizontal-outline",
        color: "#9CA3AF",
        amountSar: 822,
        pct: 11,
        changePct: +11,
      },
    ],
    aiTips: [
      {
        id: "t1",
        icon: "bag-outline",
        title: "Shopping spike in March",
        body: "Shopping hit SAR 1,750 this month — Ramadan shopping accounted for much of this. Expected seasonal bump; no action needed.",
        savingSar: undefined,
      },
      {
        id: "t2",
        icon: "restaurant-outline",
        title: "Dining creeping up",
        body: "Food spend has risen three months in a row. Setting a SAR 1,600 monthly target in your budget would bring it back to Feb levels.",
        savingSar: 350,
      },
    ],
    aiSummary:
      "March spend was SAR 560 above February, partly driven by Ramadan shopping and increased dining. Seasonal factors explain most of the rise — your fixed costs (rent, subs) stayed flat. Watch food and shopping heading into Q2.",
  },
];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "s1",
    name: "Netflix",
    initials: "Nf",
    color: "#E50914",
    category: "entertainment",
    amountSar: 47,
    cycle: "monthly",
    nextBillingDay: 3,
    status: "active",
  },
  {
    id: "s2",
    name: "Spotify",
    initials: "Sp",
    color: "#1DB954",
    category: "entertainment",
    amountSar: 25,
    cycle: "monthly",
    nextBillingDay: 14,
    status: "active",
  },
  {
    id: "s3",
    name: "Amazon Prime",
    initials: "Am",
    color: "#FF9900",
    category: "shopping",
    amountSar: 39,
    cycle: "monthly",
    nextBillingDay: 22,
    status: "active",
  },
  {
    id: "s4",
    name: "LinkedIn Premium",
    initials: "Li",
    color: "#0A66C2",
    category: "productivity",
    amountSar: 169,
    cycle: "monthly",
    nextBillingDay: 7,
    status: "active",
  },
  {
    id: "s5",
    name: "Adobe CC",
    initials: "Cc",
    color: "#FF0000",
    category: "productivity",
    amountSar: 344,
    cycle: "monthly",
    nextBillingDay: 18,
    status: "paused",
  },
  {
    id: "s6",
    name: "Fitness Time",
    initials: "Ft",
    color: "#7C3AED",
    category: "health",
    amountSar: 200,
    cycle: "monthly",
    nextBillingDay: 1,
    status: "active",
  },
  {
    id: "s7",
    name: "HungerStation Pro",
    initials: "Hs",
    color: "#F97316",
    category: "food",
    amountSar: 15,
    cycle: "monthly",
    nextBillingDay: 28,
    status: "active",
  },
  {
    id: "s8",
    name: "iCloud+",
    initials: "iC",
    color: "#3B82F6",
    category: "productivity",
    amountSar: 13,
    cycle: "monthly",
    nextBillingDay: 10,
    status: "active",
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

export type GiftCardCategory = "shopping" | "entertainment" | "food" | "travel" | "gaming";

export type GiftCardDenomination = {
  sarValue: number;
  pointsCost: number;
};

export type GiftCard = {
  id: string;
  name: string;
  initials: string;
  color: string;
  category: GiftCardCategory;
  denominations: GiftCardDenomination[];
};

export const MOCK_GIFT_CARDS: GiftCard[] = [
  {
    id: "gc1",
    name: "Amazon",
    initials: "Am",
    color: "#FF9900",
    category: "shopping",
    denominations: [
      { sarValue: 50, pointsCost: 500 },
      { sarValue: 100, pointsCost: 950 },
      { sarValue: 200, pointsCost: 1_800 },
    ],
  },
  {
    id: "gc2",
    name: "HungerStation",
    initials: "Hs",
    color: "#F97316",
    category: "food",
    denominations: [
      { sarValue: 50, pointsCost: 500 },
      { sarValue: 100, pointsCost: 950 },
    ],
  },
  {
    id: "gc3",
    name: "Netflix",
    initials: "Nf",
    color: "#E50914",
    category: "entertainment",
    denominations: [
      { sarValue: 47, pointsCost: 470 },
      { sarValue: 94, pointsCost: 900 },
    ],
  },
  {
    id: "gc4",
    name: "PlayStation",
    initials: "PS",
    color: "#003791",
    category: "gaming",
    denominations: [
      { sarValue: 50, pointsCost: 500 },
      { sarValue: 100, pointsCost: 950 },
      { sarValue: 200, pointsCost: 1_800 },
    ],
  },
  {
    id: "gc5",
    name: "Spotify",
    initials: "Sp",
    color: "#1DB954",
    category: "entertainment",
    denominations: [
      { sarValue: 25, pointsCost: 250 },
      { sarValue: 50, pointsCost: 480 },
    ],
  },
  {
    id: "gc6",
    name: "Noon",
    initials: "No",
    color: "#E5B800",
    category: "shopping",
    denominations: [
      { sarValue: 50, pointsCost: 500 },
      { sarValue: 100, pointsCost: 950 },
      { sarValue: 250, pointsCost: 2_300 },
    ],
  },
  {
    id: "gc7",
    name: "Uber",
    initials: "Ub",
    color: "#1A1426",
    category: "travel",
    denominations: [
      { sarValue: 50, pointsCost: 500 },
      { sarValue: 100, pointsCost: 950 },
    ],
  },
  {
    id: "gc8",
    name: "Careem",
    initials: "Cr",
    color: "#5BB75B",
    category: "travel",
    denominations: [
      { sarValue: 50, pointsCost: 500 },
      { sarValue: 100, pointsCost: 950 },
    ],
  },
  {
    id: "gc9",
    name: "Jarir",
    initials: "Jr",
    color: "#EF4444",
    category: "shopping",
    denominations: [
      { sarValue: 100, pointsCost: 950 },
      { sarValue: 200, pointsCost: 1_800 },
    ],
  },
  {
    id: "gc10",
    name: "Apple",
    initials: "Ap",
    color: "#555555",
    category: "entertainment",
    denominations: [
      { sarValue: 50, pointsCost: 500 },
      { sarValue: 100, pointsCost: 950 },
      { sarValue: 200, pointsCost: 1_800 },
    ],
  },
];

// ─── Deals ────────────────────────────────────────────────────────────────────

export type DealEligibility = "student" | "corporate" | "both";
export type DealBenefitType = "cashback" | "fee_discount" | "bonus_points";

export type Deal = {
  id: string;
  brand: string;
  initials: string;
  color: string;
  eligibility: DealEligibility;
  title: string;
  description: string;
  benefitValue: string;
  benefitType: DealBenefitType;
  validUntil: string;
  highlighted: boolean;
};

export const MOCK_DEALS: Deal[] = [
  {
    id: "d1",
    brand: "finmy Student",
    initials: "fS",
    color: "#7C3AED",
    eligibility: "student",
    title: "Zero admin fees",
    description: "Verified students pay zero admin fees on all transactions for 12 months.",
    benefitValue: "100% off",
    benefitType: "fee_discount",
    validUntil: "Dec 2026",
    highlighted: true,
  },
  {
    id: "d2",
    brand: "finmy Corporate",
    initials: "fC",
    color: "#EC4899",
    eligibility: "corporate",
    title: "2× cashback on all spend",
    description: "Employees of partner companies earn 2× cashback on every card purchase.",
    benefitValue: "2×",
    benefitType: "cashback",
    validUntil: "Dec 2026",
    highlighted: true,
  },
  {
    id: "d3",
    brand: "STC",
    initials: "St",
    color: "#8B5CF6",
    eligibility: "both",
    title: "5% cashback on bills",
    description: "Pay your STC mobile or broadband bill through finmy and earn 5% back.",
    benefitValue: "5%",
    benefitType: "cashback",
    validUntil: "Sep 2026",
    highlighted: false,
  },
  {
    id: "d4",
    brand: "HungerStation",
    initials: "Hs",
    color: "#F97316",
    eligibility: "student",
    title: "10% off every order",
    description: "Students get 10% off every HungerStation order paid with your finmy Mada card.",
    benefitValue: "10%",
    benefitType: "cashback",
    validUntil: "Jun 2026",
    highlighted: false,
  },
  {
    id: "d5",
    brand: "Jarir",
    initials: "Jr",
    color: "#EF4444",
    eligibility: "student",
    title: "500 bonus points",
    description: "Earn 500 bonus points on your first Jarir purchase above SAR 200.",
    benefitValue: "+500 pts",
    benefitType: "bonus_points",
    validUntil: "Aug 2026",
    highlighted: false,
  },
  {
    id: "d6",
    brand: "Almosafer",
    initials: "Al",
    color: "#3B82F6",
    eligibility: "corporate",
    title: "3% cashback on travel",
    description: "Corporate card holders earn 3% cashback on Almosafer flights and hotels.",
    benefitValue: "3%",
    benefitType: "cashback",
    validUntil: "Dec 2026",
    highlighted: false,
  },
  {
    id: "d7",
    brand: "Shawarmer",
    initials: "Sh",
    color: "#D97706",
    eligibility: "student",
    title: "Free delivery",
    description:
      "Free delivery on all Shawarmer orders placed through finmy for verified students.",
    benefitValue: "Free",
    benefitType: "fee_discount",
    validUntil: "Jul 2026",
    highlighted: false,
  },
  {
    id: "d8",
    brand: "Extra Stores",
    initials: "Ex",
    color: "#0EA5E9",
    eligibility: "corporate",
    title: "3% fee waived",
    description: "Partner employees get the 3% foreign currency fee waived on all Extra purchases.",
    benefitValue: "3% off",
    benefitType: "fee_discount",
    validUntil: "Dec 2026",
    highlighted: false,
  },
];
