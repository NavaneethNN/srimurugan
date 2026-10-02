import type { FoodVariant } from "./schema";

export type FoodCategory = {
  id: number;
  name: string;
  sortOrder: number;
};

export type FoodProduct = {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  imageUrl: string;
  tag: string | null;
  variants: FoodVariant[];
  isAvailable: boolean;
  sortOrder: number;
};

export type FoodOrderItem = {
  productId: number;
  variantId: string;
  name: string;
  variantName: string;
  unitPricePaise: number | null;
  quantity: number;
};

export function formatPrice(pricePaise: number | null) {
  return pricePaise === null ? "Price coming soon" : `₹${(pricePaise / 100).toFixed(2).replace(/\.00$/, "")}`;
}
