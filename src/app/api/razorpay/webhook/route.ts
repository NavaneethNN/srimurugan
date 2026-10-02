import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";
import { confirmFoodPayment } from "@/lib/foodPayment";
import { verifyRazorpayWebhook } from "@/lib/razorpay";
import { readTextBody, RequestTooLargeError } from "@/lib/requestBody";

export async function POST(request: NextRequest) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  let rawBody: string;
  try { rawBody = await readTextBody(request, 65_536); } catch (error) {
    return NextResponse.json({ error: error instanceof RequestTooLargeError ? "Webhook is too large." : "Invalid webhook." }, { status: error instanceof RequestTooLargeError ? 413 : 400 });
  }
  if (!verifyRazorpayWebhook(rawBody, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }
  let event: unknown;
  try { event = JSON.parse(rawBody); } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  if (!event || typeof event !== "object") {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  const data = event as { event?: string; payload?: { payment?: { entity?: { id?: unknown; order_id?: unknown } } } };
  if (data.event !== "payment.captured" && data.event !== "payment.authorized") {
    return NextResponse.json({ ok: true });
  }
  const paymentId = data.payload?.payment?.entity?.id;
  const razorpayOrderId = data.payload?.payment?.entity?.order_id;
  if (typeof paymentId !== "string" || !/^pay_[A-Za-z0-9]+$/.test(paymentId) ||
      typeof razorpayOrderId !== "string" || !/^order_[A-Za-z0-9]+$/.test(razorpayOrderId)) {
    return NextResponse.json({ ok: true });
  }
  try {
    const [order] = await getDb().select().from(foodOrders).where(eq(foodOrders.razorpayOrderId, razorpayOrderId)).limit(1);
    if (!order || !order.amountPaise || order.paymentStatus === "paid") {
      return NextResponse.json({ ok: true });
    }
    const confirmed = await confirmFoodPayment(order.id, razorpayOrderId, paymentId, order.amountPaise);
    if (!confirmed) return NextResponse.json({ error: "Payment has not been captured." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Razorpay webhook processing failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
