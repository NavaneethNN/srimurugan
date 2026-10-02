ALTER TABLE "food_orders" ADD COLUMN "checkout_key" varchar(36);--> statement-breakpoint
ALTER TABLE "food_orders" ADD COLUMN "request_hash" varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX "food_orders_checkout_key_unique" ON "food_orders" USING btree ("checkout_key");--> statement-breakpoint
CREATE INDEX "food_orders_queue_idx" ON "food_orders" USING btree ("payment_status","status","id");