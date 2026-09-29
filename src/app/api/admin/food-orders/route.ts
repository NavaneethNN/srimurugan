import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";

export async function GET() {
  try {
    const orders = await getDb().select().from(foodOrders).orderBy(desc(foodOrders.createdAt)).limit(100);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Unable to load food orders", error);
    return NextResponse.json({ error: "Unable to load orders." }, { status: 500 });
  }
}
