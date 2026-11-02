import { getDb } from "../src/lib/db";
import { foodProducts } from "../src/lib/schema";
import { eq } from "drizzle-orm";
import { invalidatePublicFoodMenu } from "../src/lib/foodMenuDb";

const prices: Record<number, number> = {
  2: 16000,
  3: 4000,
  4: 5000,
  5: 6500,
  6: 8000,
  7: 12000,
  8: 11000,
  9: 14000,
  10: 13000,
  11: 9000,
  12: 14000,
  13: 11000,
  14: 15000,
  15: 5000,
  16: 9000,
  17: 6000,
  18: 6000,
  19: 6000,
  20: 5000,
  21: 2000,
  22: 9000,
  23: 8000,
  24: 12000,
  25: 6000,
};

async function main() {
  const db = getDb();
  for (const [idStr, pricePaise] of Object.entries(prices)) {
    const id = Number(idStr);
    const existing = await db.select().from(foodProducts).where(eq(foodProducts.id, id));
    if (existing.length > 0) {
      const v = existing[0].variants;
      if (v.length > 0 && (v[0].pricePaise === null || v[0].pricePaise <= 0)) {
        v[0].pricePaise = pricePaise;
        await db.update(foodProducts).set({ variants: v, updatedAt: new Date() }).where(eq(foodProducts.id, id));
        console.log(`Updated product ${id} (${existing[0].name}) to ₹${pricePaise / 100}`);
      }
    }
  }
  invalidatePublicFoodMenu();
  console.log("All products updated successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error setting prices:", err);
  process.exit(1);
});

