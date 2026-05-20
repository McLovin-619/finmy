CREATE TYPE "public"."allowance_relation" AS ENUM('son', 'daughter', 'staff', 'other');--> statement-breakpoint
CREATE TYPE "public"."bill_category" AS ENUM('rent', 'utilities', 'bnpl', 'telecom', 'insurance', 'other');--> statement-breakpoint
CREATE TYPE "public"."card_network" AS ENUM('mada', 'visa', 'mastercard');--> statement-breakpoint
CREATE TYPE "public"."card_status" AS ENUM('active', 'frozen', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."card_type" AS ENUM('virtual', 'physical');--> statement-breakpoint
CREATE TYPE "public"."group_member_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."investment_cadence" AS ENUM('monthly', 'quarterly');--> statement-breakpoint
CREATE TYPE "public"."investment_sector" AS ENUM('us_stocks', 'saudi_equities', 'real_estate', 'sukuk');--> statement-breakpoint
CREATE TYPE "public"."investment_status" AS ENUM('active', 'paused', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."loyalty_tier" AS ENUM('standard', 'silver', 'gold', 'diamond');--> statement-breakpoint
CREATE TYPE "public"."subscription_category" AS ENUM('streaming', 'music', 'gaming', 'fitness', 'software', 'other');--> statement-breakpoint
CREATE TYPE "public"."subscription_cycle" AS ENUM('monthly', 'yearly');--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'allowance_payment';--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'investment_deduction';--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'bill_payment';--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'card_payment';--> statement-breakpoint
CREATE TABLE "allowances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relation" "allowance_relation" NOT NULL,
	"target_iban_or_phone" text NOT NULL,
	"amount_halalas" integer NOT NULL,
	"frequency" "payout_frequency" NOT NULL,
	"next_payout_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"total_sent_halalas" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" "bill_category" NOT NULL,
	"amount_halalas" integer DEFAULT 0 NOT NULL,
	"due_day_of_month" integer,
	"next_due_date" timestamp with time zone NOT NULL,
	"provider" text,
	"external_ref" text,
	"auto_pay" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"last4" text NOT NULL,
	"network" "card_network" NOT NULL,
	"card_type" "card_type" NOT NULL,
	"label" text,
	"spend_limit_halalas" integer,
	"status" "card_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "group_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"sector" "investment_sector" NOT NULL,
	"amount_halalas" integer NOT NULL,
	"cadence" "investment_cadence" DEFAULT 'monthly' NOT NULL,
	"next_execution_date" timestamp with time zone NOT NULL,
	"status" "investment_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linked_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plaid_item_id" text NOT NULL,
	"plaid_account_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"institution_name" text NOT NULL,
	"name" text NOT NULL,
	"mask" text,
	"account_type" text NOT NULL,
	"account_subtype" text,
	"encrypted_access_token" text NOT NULL,
	"access_token_iv" text NOT NULL,
	"cursor" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "linked_accounts_plaid_item_id_unique" UNIQUE("plaid_item_id")
);
--> statement-breakpoint
CREATE TABLE "loyalty" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" "loyalty_tier" DEFAULT 'standard' NOT NULL,
	"points_balance" integer DEFAULT 0 NOT NULL,
	"lifetime_points" integer DEFAULT 0 NOT NULL,
	"lifetime_deposit_halalas" bigint DEFAULT 0 NOT NULL,
	"lifetime_spend_halalas" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" "subscription_category" NOT NULL,
	"amount_halalas" integer NOT NULL,
	"cycle" "subscription_cycle" NOT NULL,
	"next_billing_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"detected_from_wallet_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allowances" ADD CONSTRAINT "allowances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_wallet_id_digital_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."digital_wallets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_wallet_id_digital_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."digital_wallets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_schedules" ADD CONSTRAINT "investment_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_schedules" ADD CONSTRAINT "investment_schedules_wallet_id_digital_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."digital_wallets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linked_accounts" ADD CONSTRAINT "linked_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty" ADD CONSTRAINT "loyalty_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_detected_from_wallet_id_digital_wallets_id_fk" FOREIGN KEY ("detected_from_wallet_id") REFERENCES "public"."digital_wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "allowances_user_id_idx" ON "allowances" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bills_user_id_next_due_idx" ON "bills" USING btree ("user_id","next_due_date");--> statement-breakpoint
CREATE INDEX "cards_user_id_idx" ON "cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "group_members_group_id_idx" ON "group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_members_user_id_idx" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "investment_schedules_user_id_idx" ON "investment_schedules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "investment_schedules_next_exec_idx" ON "investment_schedules" USING btree ("next_execution_date","status");--> statement-breakpoint
CREATE INDEX "linked_accounts_user_id_idx" ON "linked_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "linked_accounts_plaid_item_id_idx" ON "linked_accounts" USING btree ("plaid_item_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_id_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");