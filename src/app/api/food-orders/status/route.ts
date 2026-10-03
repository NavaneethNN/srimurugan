import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";
import { confirmFoodPayment, foodOrderConfirmation } from "@/lib/foodPayment";
import { fetchRazorpayOrderPayments, isCapturedFoodPayment, razorpayKeyId } from "@/lib/razorpay";
import { readJsonBody, RequestTooLargeError } from "@/lib/requestBody";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await readJsonBody(request, 1_024); } catch (error) {
    return NextResponse.json({ error: error instanceof RequestTooLargeError ? "Request is too large." : "Invalid checkout." }, { status: error instanceof RequestTooLargeError ? 413 : 400 });
  }
  const checkoutKey = (body as Record<string, unknown> | null)?.checkoutKey;
  if (typeof checkoutKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutKey)) {
    return NextResponse.json({ error: "Invalid checkout." }, { status: 400 });
  }
  try {
    const [order] = await getDb().select().from(foodOrders).where(eq(foodOrders.checkoutKey, checkoutKey)).limit(1);
    if (!order) return NextResponse.json({ error: "Checkout not found." }, { status: 404 });
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ paymentStatus: "paid", ...foodOrderConfirmation(order) }, { headers: { "Cache-Control": "no-store" } });
    }
    if (!order.razorpayOrderId || !order.amountPaise) {
      if (order.paymentStatus === "create_failed") return NextResponse.json({ error: "Checkout can be retried." }, { status: 404 });
      return NextResponse.json({ error: "Checkout is being prepared. Please retry shortly." },
        { status: 202, headers: { "Retry-After": "2", "Cache-Control": "no-store" } });
    }
    const payments = await fetchRazorpayOrderPayments(order.razorpayOrderId);
    const successful = payments.items.find((payment) => isCapturedFoodPayment(payment, order.razorpayOrderId!, payment.id, order.amountPaise!)) ||
      payments.items.find((payment) => payment.status === "authorized" && payment.id &&
        payment.order_id === order.razorpayOrderId && payment.amount === order.amountPaise && payment.currency === "INR");
    if (successful) {
      const confirmed = await confirmFoodPayment(order.id, order.razorpayOrderId, successful.id, order.amountPaise);
      if (confirmed) {
        return NextResponse.json({ paymentStatus: "paid", ...foodOrderConfirmation(confirmed) }, { headers: { "Cache-Control": "no-store" } });
      }
      return NextResponse.json({ error: "Payment confirmation is delayed. Please try again shortly." }, { status: 503 });
    }
    return NextResponse.json({
      paymentStatus: "created", orderId: order.id, razorpayOrderId: order.razorpayOrderId,
      keyId: razorpayKeyId(), amountPaise: order.amountPaise, currency: "INR",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Food order status lookup failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Could not check payment status. Please try again." }, { status: 503 });
  }
}
