import type { FoodCategory, FoodProduct } from "./foodMenu";

type Suggestion = { product: FoodProduct; variant: FoodProduct["variants"][number]; reason: string };
type Upgrade = { product: FoodProduct; from: FoodProduct["variants"][number]; to: FoodProduct["variants"][number]; additionalPaise: number };

function sizeOf(name: string) {
  const match = name.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(ml|l|g|kg)\b/);
  if (!match) return null;
  const unit = match[2];
  return { amount: Number(match[1]) * (unit === "l" || unit === "kg" ? 1000 : 1), kind: unit === "ml" || unit === "l" ? "volume" : "weight" };
}

export function recommendVariantUpgrade(
  products: FoodProduct[],
  selected: { productId: number; variantId: string; quantity: number }[],
  cartTotalPaise: number,
): Upgrade | null {
  const upgrades: Upgrade[] = [];
  for (const item of selected) {
    if (item.quantity !== 1) continue;
    const product = products.find((candidate) => candidate.id === item.productId && candidate.isAvailable);
    const from = product?.variants.find((variant) => variant.id === item.variantId);
    const fromSize = from && sizeOf(from.name);
    if (!product || !from || !fromSize || !from.pricePaise || from.pricePaise < 100) continue;
    for (const to of product.variants) {
      const toSize = sizeOf(to.name);
      if (!toSize || toSize.kind !== fromSize.kind || toSize.amount <= fromSize.amount ||
          !to.pricePaise || to.pricePaise <= from.pricePaise ||
          selected.some((line) => line.productId === product.id && line.variantId === to.id)) continue;
      if (to.pricePaise / toSize.amount >= from.pricePaise / fromSize.amount) continue;
      const additionalPaise = to.pricePaise - from.pricePaise;
      if (additionalPaise > cartTotalPaise * 0.6) continue;
      upgrades.push({ product, from, to, additionalPaise });
    }
  }
  return upgrades.sort((a, b) => a.additionalPaise - b.additionalPaise)[0] || null;
}

function kind(name: string) {
  const label = name.toLowerCase();
  if (/drink|beverage|coffee|juice|soda|water/.test(label)) return "drink";
  if (/dessert|sweet|ice cream|cake/.test(label)) return "dessert";
  if (/snack|food|popcorn|meal|bite/.test(label)) return "snack";
  return "other";
}

export function recommendAddOns(
  categories: FoodCategory[],
  products: FoodProduct[],
  selected: { productId: number; variantId: string }[],
  cartTotalPaise: number,
): Suggestion[] {
  if (!selected.length || cartTotalPaise < 100) return [];
  const categoryKinds = new Map(categories.map((category) => [category.id, kind(category.name)]));
  const selectedIds = new Set(selected.map((item) => item.productId));
  const cartKinds = new Set(products.filter((product) => selectedIds.has(product.id)).map((product) => categoryKinds.get(product.categoryId) || "other"));
  const wanted = cartKinds.has("snack") && !cartKinds.has("drink") ? "drink"
    : cartKinds.has("drink") && !cartKinds.has("snack") ? "snack"
      : cartKinds.has("snack") && cartKinds.has("drink") && !cartKinds.has("dessert") ? "dessert" : null;

  const candidates = products.flatMap((product) => {
    if (!product.isAvailable || selectedIds.has(product.id)) return [];
    const variant = product.variants.filter((choice) => Number.isSafeInteger(choice.pricePaise) && choice.pricePaise !== null && choice.pricePaise >= 100)
      .sort((a, b) => (a.pricePaise || 0) - (b.pricePaise || 0))[0];
    if (!variant) return [];
    const categoryKind = categoryKinds.get(product.categoryId) || "other";
    const priceRatio = (variant.pricePaise || 0) / cartTotalPaise;
    const score = (categoryKind === wanted ? 100 : 0)
      + (!cartKinds.has(categoryKind) ? 35 : 0)
      + (priceRatio <= 0.6 ? 20 : priceRatio <= 1 ? 5 : -15)
      + (priceRatio >= 0.15 && priceRatio <= 0.5 ? 8 : 0)
      + (product.tag ? 2 : 0);
    const reason = categoryKind === "drink" && cartKinds.has("snack") ? "A drink for your snack"
      : categoryKind === "snack" && cartKinds.has("drink") ? "Something to eat with your drink"
        : categoryKind === "dessert" ? "A sweet finish"
          : "Add something extra for the show";
    return [{ product, variant, categoryKind, score, reason }];
  }).sort((a, b) => b.score - a.score || a.product.sortOrder - b.product.sortOrder || a.product.id - b.product.id);

  const suggestions: Suggestion[] = [];
  const usedKinds = new Set<string>();
  for (const candidate of candidates) {
    if (usedKinds.has(candidate.categoryKind) && candidates.some((item) => !usedKinds.has(item.categoryKind))) continue;
    suggestions.push({ product: candidate.product, variant: candidate.variant, reason: candidate.reason });
    usedKinds.add(candidate.categoryKind);
    if (suggestions.length === 2) break;
  }
  return suggestions;
}
