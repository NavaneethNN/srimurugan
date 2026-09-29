-- Apply to an existing Sri Murugan database that already has the movie tables.
CREATE TABLE IF NOT EXISTS "food_orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "customer_name" varchar(120),
  "seat" varchar(120) NOT NULL,
  "items" jsonb NOT NULL,
  "status" varchar(30) DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
