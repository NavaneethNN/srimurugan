import type { FoodVariant } from "./schema";

export type ProductInput = {
  categoryId: number;
  name: string;
  description: string;
  imageUrl: string;
  tag: string | null;
  isAvailable: boolean;
  sortOrder: number;
  variants: { id?: string; name: string; pricePaise: number }[];
};

export function parseCategoryInput(body: unknown) {
  if (!body || typeof body !== "object") throw new Error("Enter a category name.");
  const record = body as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const sortOrder = record.sortOrder === undefined ? 0 : record.sortOrder;
  if (!name || name.length > 80) throw new Error("Category name must be 1–80 characters.");
  if (!Number.isInteger(sortOrder) || Number(sortOrder) < 0 || Number(sortOrder) > 10000) throw new Error("Enter a valid display order.");
  return { name, sortOrder: Number(sortOrder) };
}

function validImageUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseProductInput(body: unknown): ProductInput {
  if (!body || typeof body !== "object") throw new Error("Enter product details.");
  const record = body as Record<string, unknown>;
  const categoryId = record.categoryId;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const description = typeof record.description === "string" ? record.description.trim() : "";
  const imageUrl = typeof record.imageUrl === "string" ? record.imageUrl.trim() : "";
  const tag = typeof record.tag === "string" ? record.tag.trim() : "";
  const sortOrder = record.sortOrder === undefined ? 0 : record.sortOrder;
  const isAvailable = record.isAvailable === undefined ? true : record.isAvailable;
  const rawVariants = record.variants;

  if (!Number.isSafeInteger(categoryId) || Number(categoryId) < 1) throw new Error("Choose a category.");
  if (!name || name.length > 120) throw new Error("Product name must be 1–120 characters.");
  if (description.length > 1000) throw new Error("Description is too long.");
  if (imageUrl.length > 2000 || !validImageUrl(imageUrl)) throw new Error("Use an HTTPS image URL or a local image path.");
  if (tag.length > 80) throw new Error("Tag is too long.");
  if (!Number.isInteger(sortOrder) || Number(sortOrder) < 0 || Number(sortOrder) > 10000) throw new Error("Enter a valid display order.");
  if (typeof isAvailable !== "boolean") throw new Error("Invalid availability value.");
  if (!Array.isArray(rawVariants) || rawVariants.length < 1 || rawVariants.length > 20) throw new Error("Add 1–20 variants.");

  const variants = rawVariants.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Enter a variant name and price.");
    const variant = value as Record<string, unknown>;
    const variantName = typeof variant.name === "string" ? variant.name.trim() : "";
    const id = typeof variant.id === "string" ? variant.id : undefined;
    if (!variantName || variantName.length > 80) throw new Error("Variant names must be 1–80 characters.");
    if (!Number.isSafeInteger(variant.pricePaise) || Number(variant.pricePaise) < 100 || Number(variant.pricePaise) > 100000000) {
      throw new Error("Enter a price of at least ₹1 for every variant.");
    }
    return { id, name: variantName, pricePaise: Number(variant.pricePaise) };
  });
  if (new Set(variants.map((variant) => variant.name.toLocaleLowerCase())).size !== variants.length) {
    throw new Error("Variant names must be unique within a product.");
  }
  return { categoryId: Number(categoryId), name, description, imageUrl, tag: tag || null, sortOrder: Number(sortOrder), isAvailable, variants };
}

export function assignVariantIds(input: ProductInput["variants"], existing: FoodVariant[] = []): FoodVariant[] {
  const existingIds = new Set(existing.map((variant) => variant.id));
  const used = new Set<string>();
  return input.map((variant) => {
    const id = variant.id && existingIds.has(variant.id) && !used.has(variant.id) ? variant.id : crypto.randomUUID();
    used.add(id);
    return { id, name: variant.name, pricePaise: variant.pricePaise };
  });
}
