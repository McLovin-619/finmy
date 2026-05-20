ALTER TYPE "public"."transaction_type" ADD VALUE 'transfer_out';--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'transfer_in';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "peer_wallet_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_peer_wallet_id_digital_wallets_id_fk" FOREIGN KEY ("peer_wallet_id") REFERENCES "public"."digital_wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_peer_wallet_idx" ON "transactions" USING btree ("peer_wallet_id");