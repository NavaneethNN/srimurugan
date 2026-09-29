import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";

const statuses = ["pending", "preparing", "completed", "cancelled"];

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const orderId = Number(id);
  const body = await request.json().catch(() => null);
  if (!Number.isSafeInteger(orderId) || orderId < 1 || !body || !statuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid order or status." }, { status: 400 });
  }
  try {
    const [order] = await getDb().update(foodOrders).set({ status: body.status, updatedAt: new Date() }).where(eq(foodOrders.id, orderId)).returning();
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Unable to update food order", error);
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }
}
