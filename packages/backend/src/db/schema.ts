import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const payoutFrequencyEnum = pgEnum("payout_frequency", ["daily", "weekly", "monthly"]);

export const staffRoleEnum = pgEnum("staff_role", [
  "driver",
  "housekeeper",
  "cook",
  "nanny",
  "gardener",
  "security",
  "other",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "salary_payment",
  "bonus",
  "deduction",
  "top_up",
  "withdrawal",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "failed",
  "reversed",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Stored normalised, e.g. "+966501234567"
  phone: text("phone").notNull().unique(),
  nameEn: text("name_en").notNull(),
  // SHA-256 of the raw national ID — never stored in plaintext (SAMA requirement)
  nationalIdHash: text("national_id_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const digitalWallets = pgTable("digital_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  iban: text("iban").notNull().unique(),
  // Balance in SAR minor units (halalas). 100 halalas = SAR 1.00.
  // integer max ≈ SAR 21.4 M — sufficient for personal wallets.
  balanceHalalas: integer("balance_halalas").notNull().default(0),
  currency: text("currency").notNull().default("SAR"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const householdStaff = pgTable("household_staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  nameEn: text("name_en").notNull(),
  role: staffRoleEnum("role").notNull(),
  payoutFrequency: payoutFrequencyEnum("payout_frequency").notNull(),
  // Base recurring salary in halalas — excludes one-off bonuses and deductions
  baseSalaryHalalas: integer("base_salary_halalas").notNull(),
  nextPayoutDate: timestamp("next_payout_date", { withTimezone: true }).notNull(),
  // IBAN for bank transfer or Saudi mobile number for wallet-to-wallet payout
  targetIbanOrPhone: text("target_iban_or_phone").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id")
    .notNull()
    .references(() => digitalWallets.id, { onDelete: "restrict" }),
  type: transactionTypeEnum("type").notNull(),
  // Always a positive integer in halalas; direction is implied by type
  amountHalalas: integer("amount_halalas").notNull(),
  status: transactionStatusEnum("status").notNull().default("pending"),
  staffRecipientId: uuid("staff_recipient_id").references(() => householdStaff.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Rows are never updated or deleted — SAMA requires an immutable compliance trail
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  action: text("action").notNull(), // e.g. "staff.pay_salary"
  targetType: text("target_type").notNull(), // e.g. "household_staff"
  targetId: text("target_id").notNull(),
  beforeState: jsonb("before_state").$type<Record<string, unknown>>(),
  afterState: jsonb("after_state").$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(digitalWallets),
  staff: many(householdStaff),
  auditLogs: many(auditLogs),
}));

export const digitalWalletsRelations = relations(digitalWallets, ({ one, many }) => ({
  owner: one(users, { fields: [digitalWallets.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const householdStaffRelations = relations(householdStaff, ({ one, many }) => ({
  employer: one(users, { fields: [householdStaff.employerId], references: [users.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(digitalWallets, {
    fields: [transactions.walletId],
    references: [digitalWallets.id],
  }),
  staffRecipient: one(householdStaff, {
    fields: [transactions.staffRecipientId],
    references: [householdStaff.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));
