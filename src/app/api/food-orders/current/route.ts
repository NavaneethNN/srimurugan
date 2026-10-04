import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";
import { foodOrderConfirmation } from "@/lib/foodPayment";
import { CUSTOMER_ORDER_COOKIE, verifyCustomerOrderSession } from "@/lib/customerOrderSession";

export async function GET(request: NextRequest) {
  const orderId = verifyCustomerOrderSession(request.cookies.get(CUSTOMER_ORDER_COOKIE)?.value, process.env.SESSION_SECRET);
  if (!orderId) return NextResponse.json({ error: "No current order." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const [order] = await getDb().select().from(foodOrders).where(eq(foodOrders.id, orderId)).limit(1);
    if (!order || order.paymentStatus !== "paid" || !order.razorpayPaymentId || !order.paidAt) {
      return NextResponse.json({ error: "Order not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(foodOrderConfirmation(order), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Customer order status lookup failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Could not load order status." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
