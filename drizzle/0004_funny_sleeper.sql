CREATE TABLE IF NOT EXISTS "cafe_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"pin" varchar(6) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cafe_users_pin_unique" UNIQUE("pin")
);
--> statement-breakpoint
ALTER TABLE "food_orders" ALTER COLUMN "payment_status" SET DEFAULT 'awaiting_payment';
