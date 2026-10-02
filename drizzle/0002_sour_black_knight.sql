ALTER TABLE "food_orders" ADD COLUMN "payment_status" varchar(20) DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "food_orders" ADD COLUMN "amount_paise" integer;--> statement-breakpoint
ALTER TABLE "food_orders" ADD COLUMN "razorpay_order_id" varchar(80);--> statement-breakpoint
ALTER TABLE "food_orders" ADD COLUMN "razorpay_payment_id" varchar(80);--> statement-breakpoint
ALTER TABLE "food_orders" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "food_orders_razorpay_order_id_unique" ON "food_orders" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "food_orders_razorpay_payment_id_unique" ON "food_orders" USING btree ("razorpay_payment_id");