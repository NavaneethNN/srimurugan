import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { confirmFoodPayment, foodOrderConfirmation } from "@/lib/foodPayment";
import { readJsonBody, RequestTooLargeError } from "@/lib/requestBody";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await readJsonBody(request, 2_048); } catch (error) {
    return NextResponse.json({ error: error instanceof RequestTooLargeError ? "Request is too large." : "Invalid payment details." }, { status: error instanceof RequestTooLargeError ? 413 : 400 });
  }
  const data = body as Record<string, unknown> | null;
  const orderId = Number(data?.orderId);
  const paymentId = data?.razorpay_payment_id;
  const razorpayOrderId = data?.razorpay_order_id;
  const signature = data?.razorpay_signature;
  if (!Number.isSafeInteger(orderId) || orderId < 1 || typeof paymentId !== "string" || !/^pay_[A-Za-z0-9]+$/.test(paymentId) ||
      typeof razorpayOrderId !== "string" || !/^order_[A-Za-z0-9]+$/.test(razorpayOrderId) || typeof signature !== "string") {
    return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
  }
  try {
    const db = getDb();
    const [order] = await db.select().from(foodOrders).where(eq(foodOrders.id, orderId)).limit(1);
    if (!order || !order.razorpayOrderId || !order.amountPaise || order.razorpayOrderId !== razorpayOrderId ||
        !verifyRazorpaySignature(order.razorpayOrderId, paymentId, signature)) {
      return NextResponse.json({ error: "Payment verification failed. Please contact the cinema with your payment ID." }, { status: 400 });
    }
    if (order.paymentStatus === "paid" && order.razorpayPaymentId !== paymentId) {
      return NextResponse.json({ error: "This order has already been paid." }, { status: 409 });
    }
    if (order.paymentStatus === "paid" && order.razorpayPaymentId === paymentId) {
      return NextResponse.json(foodOrderConfirmation(order), { headers: { "Cache-Control": "no-store" } });
    }

    const confirmed = await confirmFoodPayment(order.id, order.razorpayOrderId, paymentId, order.amountPaise);
    if (!confirmed || !confirmed.paidAt) {
      return NextResponse.json({ error: "Payment was received, but the order could not be confirmed. Please contact the cinema with your payment ID." }, { status: 409 });
    }
    return NextResponse.json(foodOrderConfirmation(confirmed), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Food payment verification failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Payment confirmation is delayed. Please keep your payment ID and contact the cinema if your order does not appear." }, { status: 503 });
  }
}
