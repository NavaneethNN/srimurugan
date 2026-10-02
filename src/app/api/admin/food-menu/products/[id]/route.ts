import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodCategories, foodProducts } from "@/lib/schema";
import { assignVariantIds, parseProductInput } from "@/lib/foodMenuValidation";
import { invalidatePublicFoodMenu } from "@/lib/foodMenuDb";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid product." }, { status: 400 });
  let input;
  try {
    input = parseProductInput(await request.json());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid product." }, { status: 400 });
  }
  try {
    const db = getDb();
    const [[existing], [category]] = await Promise.all([
      db.select().from(foodProducts).where(eq(foodProducts.id, id)),
      db.select({ id: foodCategories.id }).from(foodCategories).where(eq(foodCategories.id, input.categoryId)),
    ]);
    if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 400 });
    const [product] = await db.update(foodProducts).set({ ...input, variants: assignVariantIds(input.variants, existing.variants), updatedAt: new Date() }).where(eq(foodProducts.id, id)).returning();
    invalidatePublicFoodMenu();
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Unable to update cafe product", error);
    return NextResponse.json({ error: "Unable to update product." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid product." }, { status: 400 });
  try {
    const [product] = await getDb().delete(foodProducts).where(eq(foodProducts.id, id)).returning();
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    invalidatePublicFoodMenu();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unable to delete cafe product", error);
    return NextResponse.json({ error: "Unable to delete product." }, { status: 500 });
  }
}
