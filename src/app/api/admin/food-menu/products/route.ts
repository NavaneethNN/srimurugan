import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodCategories, foodProducts } from "@/lib/schema";
import { assignVariantIds, parseProductInput } from "@/lib/foodMenuValidation";
import { invalidatePublicFoodMenu } from "@/lib/foodMenuDb";

export async function POST(request: NextRequest) {
  let input;
  try {
    input = parseProductInput(await request.json());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid product." }, { status: 400 });
  }
  try {
    const db = getDb();
    const [category] = await db.select({ id: foodCategories.id }).from(foodCategories).where(eq(foodCategories.id, input.categoryId));
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 400 });
    const [product] = await db.insert(foodProducts).values({ ...input, variants: assignVariantIds(input.variants) }).returning();
    invalidatePublicFoodMenu();
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Unable to create cafe product", error);
    return NextResponse.json({ error: "Unable to create product." }, { status: 500 });
  }
}
