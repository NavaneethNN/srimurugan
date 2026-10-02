import { NextRequest, NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodCategories, foodProducts } from "@/lib/schema";
import { parseCategoryInput } from "@/lib/foodMenuValidation";
import { invalidatePublicFoodMenu } from "@/lib/foodMenuDb";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  let input;
  try {
    input = parseCategoryInput(await request.json());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid category." }, { status: 400 });
  }
  try {
    const [category] = await getDb().update(foodCategories).set(input).where(eq(foodCategories.id, id)).returning();
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    invalidatePublicFoodMenu();
    return NextResponse.json({ category });
  } catch (error) {
    console.error("Unable to update category", error);
    return NextResponse.json({ error: "Category name must be unique." }, { status: 409 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  try {
    const db = getDb();
    const [usage] = await db.select({ total: count() }).from(foodProducts).where(eq(foodProducts.categoryId, id));
    if (usage.total > 0) return NextResponse.json({ error: "Move or delete products in this category first." }, { status: 409 });
    const [category] = await db.delete(foodCategories).where(eq(foodCategories.id, id)).returning();
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    invalidatePublicFoodMenu();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unable to delete category", error);
    return NextResponse.json({ error: "Unable to delete category." }, { status: 500 });
  }
}
