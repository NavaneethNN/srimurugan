import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, lt, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders, foodProducts } from "@/lib/schema";
import type { FoodOrderItem } from "@/lib/foodMenu";
import { createRazorpayOrder, razorpayKeyId, RazorpayBusyError } from "@/lib/razorpay";
import { createHash, randomUUID } from "node:crypto";
import { readJsonBody, RequestTooLargeError } from "@/lib/requestBody";
import { retryRead } from "@/lib/retryRead";

type RequestedItem = { productId: number; variantId: string; quantity: number };
type Order = typeof foodOrders.$inferSelect;

function readyCheckout(order: Pick<Order, "id" | "razorpayOrderId" | "amountPaise">) {
  return NextResponse.json({
    orderId: order.id, razorpayOrderId: order.razorpayOrderId,
    keyId: razorpayKeyId(), amountPaise: order.amountPaise, currency: "INR",
  }, { headers: { "Cache-Control": "no-store" } });
}

function checkoutPreparing() {
  return NextResponse.json({ error: "Checkout is being prepared. Please retry shortly." },
    { status: 202, headers: { "Retry-After": "2", "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Enter your name, seat and at least one menu item." }, { status: 400 });
    }
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const seat = typeof body.seat === "string" ? body.seat.trim() : "";
    const requested: unknown[] = Array.isArray(body.items) ? body.items : [];
    const checkoutKey = typeof body.checkoutKey === "string" ? body.checkoutKey : "";
    const validShape = requested.every((item): item is RequestedItem => {
      if (!item || typeof item !== "object") return false;
      const entry = item as Partial<RequestedItem>;
      return Number.isSafeInteger(entry.productId) && Number(entry.productId) > 0 &&
        typeof entry.variantId === "string" && entry.variantId.length > 0 && entry.variantId.length <= 100 &&
        Number.isInteger(entry.quantity) && Number(entry.quantity) > 0 && Number(entry.quantity) <= 20;
    });
    if (!customerName || customerName.length > 120 || !seat || seat.length > 120 || !requested.length || requested.length > 30 || !validShape ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutKey)) {
      return NextResponse.json({ error: "Enter your name and screen and seat, then choose items from the menu." }, { status: 400 });
    }
    if (!process.env.SESSION_SECRET || !process.env.RAZORPAY_TEST_API_KEY || !process.env.RAZORPAY_TEST_API_SECRET) {
      return NextResponse.json({ error: "Ordering is temporarily unavailable." }, { status: 503 });
    }

    const selected = requested as RequestedItem[];
    const keys = selected.map((item) => `${item.productId}:${item.variantId}`);
    if (new Set(keys).size !== keys.length) return NextResponse.json({ error: "Duplicate menu items are not allowed." }, { status: 400 });

    const db = getDb();
    const requestHash = createHash("sha256").update(JSON.stringify({
      customerName, seat, items: selected.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }))
        .sort((a, b) => a.productId - b.productId || a.variantId.localeCompare(b.variantId)),
    })).digest("hex");
    const [existingRows, products] = await retryRead(() => db.batch([
      db.select({ id: foodOrders.id, requestHash: foodOrders.requestHash, paymentStatus: foodOrders.paymentStatus,
        razorpayOrderId: foodOrders.razorpayOrderId, amountPaise: foodOrders.amountPaise, updatedAt: foodOrders.updatedAt })
        .from(foodOrders).where(eq(foodOrders.checkoutKey, checkoutKey)).limit(1),
      db.select().from(foodProducts).where(inArray(foodProducts.id, [...new Set(selected.map((item) => item.productId))])),
    ]));
    const [existing] = existingRows;
    let claimedOrderId: number | null = null;
    let amountPaise = existing?.amountPaise || 0;
    if (existing) {
      if (existing.requestHash !== requestHash) return NextResponse.json({ error: "Your cart changed. Please start a new checkout." }, { status: 409 });
      if (existing.paymentStatus === "paid") return NextResponse.json({ error: "This order is already paid. Check your order confirmation." }, { status: 409 });
      if (existing.paymentStatus === "created" && existing.razorpayOrderId && existing.amountPaise) return readyCheckout(existing);
      const [claimed] = await db.update(foodOrders).set({ paymentStatus: "creating", updatedAt: new Date() })
        .where(and(eq(foodOrders.id, existing.id), eq(foodOrders.requestHash, requestHash),
          or(eq(foodOrders.paymentStatus, "create_failed"),
            and(eq(foodOrders.paymentStatus, "creating"), lt(foodOrders.updatedAt, new Date(Date.now() - 30_000))))))
        .returning({ id: foodOrders.id });
      if (!claimed) return checkoutPreparing();
      claimedOrderId = claimed.id;
    }
    if (!existing) {
      const byId = new Map(products.map((product) => [product.id, product]));
      const items: FoodOrderItem[] = [];
      for (const requestedItem of selected) {
        const product = byId.get(requestedItem.productId);
        const variant = product?.variants.find((choice) => choice.id === requestedItem.variantId);
        if (!product?.isAvailable || !variant) {
          return NextResponse.json({ error: "Your menu has changed. Please refresh the page and review your order." }, { status: 409 });
        }
        if (!Number.isSafeInteger(variant.pricePaise) || variant.pricePaise === null || variant.pricePaise <= 0) {
          return NextResponse.json({ error: "Some items are not yet priced. Please choose priced items only." }, { status: 409 });
        }
        amountPaise += variant.pricePaise * requestedItem.quantity;
        items.push({ productId: product.id, variantId: variant.id, name: product.name, variantName: variant.name,
          unitPricePaise: variant.pricePaise, quantity: requestedItem.quantity });
      }
      if (!Number.isSafeInteger(amountPaise) || amountPaise < 100 || amountPaise > 100_000_000) {
        return NextResponse.json({ error: "The order total must be between ₹1 and ₹10,00,000." }, { status: 400 });
      }
      const [inserted] = await db.insert(foodOrders).values({
        customerName, seat, items, amountPaise, paymentStatus: "creating", status: "awaiting_payment", checkoutKey, requestHash,
      }).onConflictDoNothing({ target: foodOrders.checkoutKey }).returning({ id: foodOrders.id });
      if (!inserted) {
        const [duplicate] = await retryRead(() => db.select().from(foodOrders).where(eq(foodOrders.checkoutKey, checkoutKey)).limit(1));
        if (duplicate?.requestHash !== requestHash) return NextResponse.json({ error: "Your cart changed. Please start a new checkout." }, { status: 409 });
        if (duplicate.paymentStatus === "created" && duplicate.razorpayOrderId) return readyCheckout(duplicate);
        return checkoutPreparing();
      }
      claimedOrderId = inserted.id;
    }
    try {
      const paymentOrder = await createRazorpayOrder(amountPaise, `cafe_${randomUUID().replaceAll("-", "")}`);
      if (!paymentOrder.id || paymentOrder.amount !== amountPaise || paymentOrder.currency !== "INR") {
        throw new Error("Razorpay returned an invalid order");
      }
      const [ready] = await db.update(foodOrders).set({ razorpayOrderId: paymentOrder.id, paymentStatus: "created", updatedAt: new Date() })
        .where(and(eq(foodOrders.id, claimedOrderId!), eq(foodOrders.paymentStatus, "creating")))
        .returning({ id: foodOrders.id, razorpayOrderId: foodOrders.razorpayOrderId, amountPaise: foodOrders.amountPaise });
      if (ready) return readyCheckout(ready);
      throw new Error("Checkout could not be completed");
    } catch (error) {
      const [ready] = await retryRead(() => db.select().from(foodOrders).where(eq(foodOrders.id, claimedOrderId!)).limit(1)).catch(() => []);
      if (ready?.paymentStatus === "created" && ready.razorpayOrderId) return readyCheckout(ready);
      await db.update(foodOrders).set({ paymentStatus: "create_failed", updatedAt: new Date() })
        .where(and(eq(foodOrders.id, claimedOrderId!), eq(foodOrders.paymentStatus, "creating"))).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ error: "The order is too large." }, { status: 413 });
    if (error instanceof RazorpayBusyError) return NextResponse.json({ error: error.message }, { status: 503, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    console.error("Food order submission failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "We could not send your order. Please try again." }, { status: 500 });
  }
}
