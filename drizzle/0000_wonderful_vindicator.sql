CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"donor_address" text NOT NULL,
	"donor_name" text,
	"amount_usd" numeric(10, 2) NOT NULL,
	"tokens_amount" bigint NOT NULL,
	"message" text,
	"transaction_signature" text
);
--> statement-breakpoint
CREATE INDEX "idx_donations_donor" ON "donations" USING btree ("donor_address");--> statement-breakpoint
CREATE INDEX "idx_donations_created_at" ON "donations" USING btree ("created_at");