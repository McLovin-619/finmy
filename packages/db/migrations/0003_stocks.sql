CREATE TYPE "public"."stock_order_side" AS ENUM('buy', 'sell');--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'stock_buy';--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'stock_sell';--> statement-breakpoint
CREATE TABLE "stock_holdings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"symbol" text NOT NULL,
	"shares_micro" bigint NOT NULL,
	"avg_cost_halalas" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"symbol" text NOT NULL,
	"side" "stock_order_side" NOT NULL,
	"shares_micro" bigint NOT NULL,
	"price_halalas" integer NOT NULL,
	"amount_halalas" integer NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_holdings" ADD CONSTRAINT "stock_holdings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_orders" ADD CONSTRAINT "stock_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_holdings_user_symbol_idx" ON "stock_holdings" USING btree ("user_id","symbol");--> statement-breakpoint
CREATE INDEX "stock_orders_user_executed_idx" ON "stock_orders" USING btree ("user_id","executed_at");