import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";
import { captureRazorpayPayment, fetchRazorpayPayment, isCapturedFoodPayment } from "@/lib/razorpay";
import { createSeatEditToken, SEAT_EDIT_WINDOW_MS } from "@/lib/foodOrderEdit";

export function foodOrderConfirmation(order: typeof foodOrders.$inferSelect) {
  if (order.paymentStatus !== "paid" || !order.paidAt || !order.razorpayPaymentId) throw new Error("Order payment is not confirmed");
  const expiresAt = order.paidAt.getTime() + SEAT_EDIT_WINDOW_MS;
  return {
    order: { id: order.id, status: order.status, customerName: order.customerName, seat: order.seat, items: order.items, amountPaise: order.amountPaise },
    editToken: createSeatEditToken(order.id, expiresAt),
    editRemainingMs: Math.max(0, expiresAt - Date.now()),
    editWindowMs: SEAT_EDIT_WINDOW_MS,
  };
}

export async function confirmFoodPayment(orderId: number, razorpayOrderId: string, paymentId: string, amountPaise: number) {
  let payment = await fetchRazorpayPayment(paymentId);
  if (payment.id !== paymentId || payment.order_id !== razorpayOrderId || payment.amount !== amountPaise || payment.currency !== "INR") return null;
  if (payment.status === "authorized") {
    try {
      payment = await captureRazorpayPayment(paymentId, amountPaise);
    } catch {
      // An automatic capture may finish between fetch and capture. Check the final state.
      payment = await fetchRazorpayPayment(paymentId);
    }
  }
  if (!isCapturedFoodPayment(payment, razorpayOrderId, paymentId, amountPaise)) return null;

  const db = getDb();
  const now = new Date();
  const [updated] = await db.update(foodOrders).set({
    paymentStatus: "paid", status: "pending", razorpayPaymentId: paymentId, paidAt: now, updatedAt: now,
  }).where(and(eq(foodOrders.id, orderId), eq(foodOrders.razorpayOrderId, razorpayOrderId), eq(foodOrders.paymentStatus, "created")))
    .returning();
  const confirmed = updated || (await db.select().from(foodOrders).where(eq(foodOrders.id, orderId)).limit(1))[0];
  return confirmed?.paymentStatus === "paid" && confirmed.razorpayPaymentId === paymentId ? confirmed : null;
}
