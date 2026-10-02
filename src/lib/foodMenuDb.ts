import { asc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { foodCategories, foodProducts } from "./schema";

export async function loadFoodMenu(includeUnavailable = false) {
  const db = getDb();
  const [categories, products] = await Promise.all([
    db.select().from(foodCategories).orderBy(asc(foodCategories.sortOrder), asc(foodCategories.id)),
    db.select().from(foodProducts)
      .where(includeUnavailable ? undefined : eq(foodProducts.isAvailable, true))
      .orderBy(asc(foodProducts.sortOrder), asc(foodProducts.id)),
  ]);
  return { categories, products };
}

let publicMenu: Awaited<ReturnType<typeof loadFoodMenu>> | null = null;
let publicMenuExpiresAt = 0;
let publicMenuInflight: Promise<Awaited<ReturnType<typeof loadFoodMenu>>> | null = null;
let publicMenuVersion = 0;

export async function loadPublicFoodMenu() {
  if (publicMenu && Date.now() < publicMenuExpiresAt) return publicMenu;
  if (publicMenuInflight) return publicMenuInflight;
  const version = publicMenuVersion;
  const pending = loadFoodMenu().then((menu) => {
    if (version === publicMenuVersion) {
      publicMenu = menu;
      publicMenuExpiresAt = Date.now() + 5_000;
    }
    return menu;
  }).finally(() => { if (publicMenuInflight === pending) publicMenuInflight = null; });
  publicMenuInflight = pending;
  return pending;
}

export function invalidatePublicFoodMenu() {
  publicMenuVersion += 1;
  publicMenu = null;
  publicMenuExpiresAt = 0;
  publicMenuInflight = null;
}
