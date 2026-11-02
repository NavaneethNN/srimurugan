import { getDb } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const db = getDb();
  console.log("Adding order tracking columns to food_orders...");
  await db.execute(sql.raw(`
    ALTER TABLE food_orders
    ADD COLUMN IF NOT EXISTS accepted_by varchar(120),
    ADD COLUMN IF NOT EXISTS accepted_at timestamp,
    ADD COLUMN IF NOT EXISTS completed_by varchar(120),
    ADD COLUMN IF NOT EXISTS completed_at timestamp,
    ADD COLUMN IF NOT EXISTS cancelled_by varchar(120),
    ADD COLUMN IF NOT EXISTS cancelled_at timestamp,
    ADD COLUMN IF NOT EXISTS status_logs jsonb DEFAULT '[]'::jsonb;
  `));
  console.log("Successfully added order tracking columns to food_orders!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
