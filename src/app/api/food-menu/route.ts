import { NextResponse } from "next/server";
import { loadPublicFoodMenu } from "@/lib/foodMenuDb";

export async function GET() {
  try {
    const menu = await loadPublicFoodMenu();
    return NextResponse.json(menu, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Unable to load food menu", error);
    return NextResponse.json({ error: "The cafe menu is temporarily unavailable." }, { status: 500 });
  }
}
