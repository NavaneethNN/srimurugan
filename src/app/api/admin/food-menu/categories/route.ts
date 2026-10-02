import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { foodCategories } from "@/lib/schema";
import { invalidatePublicFoodMenu, loadFoodMenu } from "@/lib/foodMenuDb";
import { parseCategoryInput } from "@/lib/foodMenuValidation";

export async function GET() {
  try {
    const menu = await loadFoodMenu(true);
    return NextResponse.json(menu, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load admin food menu", error);
    return NextResponse.json({ error: "Unable to load the cafe menu." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let input;
  try {
    input = parseCategoryInput(await request.json());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid category." }, { status: 400 });
  }
  try {
    const [category] = await getDb().insert(foodCategories).values(input).returning();
    invalidatePublicFoodMenu();
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Unable to create category", error);
    return NextResponse.json({ error: "Category name must be unique." }, { status: 409 });
  }
}
