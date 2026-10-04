import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";

const transitions: Record<string, string[]> = {
  preparing: ["pending"],
  completed: ["preparing"],
  cancelled: ["pending", "preparing"],
};

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const orderId = Number(id);
  const body = await request.json().catch(() => null);
  if (!Number.isSafeInteger(orderId) || orderId < 1 || !body || typeof body.status !== "string" || !transitions[body.status]) {
    return NextResponse.json({ error: "Invalid order or status." }, { status: 400 });
  }
  try {
    const [order] = await getDb().update(foodOrders).set({ status: body.status, updatedAt: new Date() })
      .where(and(eq(foodOrders.id, orderId), eq(foodOrders.paymentStatus, "paid"),
        isNotNull(foodOrders.paidAt), isNotNull(foodOrders.razorpayPaymentId),
        inArray(foodOrders.status, transitions[body.status]))).returning();
    if (!order) return NextResponse.json({ error: "Order changed or is no longer available. Refresh the queue." }, { status: 409 });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Unable to update food order", error);
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }
}
