import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, inArray, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";
import { SEAT_EDIT_WINDOW_MS, verifySeatEditToken } from "@/lib/foodOrderEdit";
import { readJsonBody, RequestTooLargeError } from "@/lib/requestBody";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const orderId = Number(id);
  let body: unknown;
  try { body = await readJsonBody(request, 1_024); } catch (error) {
    return NextResponse.json({ error: error instanceof RequestTooLargeError ? "Request is too large." : "Invalid seat details." },
      { status: error instanceof RequestTooLargeError ? 413 : 400 });
  }
  const data = body as Record<string, unknown> | null;
  const seat = typeof data?.seat === "string" ? data.seat.trim() : "";

  if (!Number.isSafeInteger(orderId) || orderId < 1 || !seat || seat.length > 120) {
    return NextResponse.json({ error: "Enter a valid screen and seat number." }, { status: 400 });
  }
  if (!verifySeatEditToken(data?.editToken, orderId)) {
    return NextResponse.json({ error: `The ${SEAT_EDIT_WINDOW_MS / 1000}-second seat edit window has ended.` }, { status: 403 });
  }

  try {
    const [order] = await getDb().update(foodOrders)
      .set({ seat, updatedAt: new Date() })
      .where(and(
        eq(foodOrders.id, orderId),
        inArray(foodOrders.paymentStatus, ["paid", "legacy"]),
        or(
          and(eq(foodOrders.paymentStatus, "paid"), gt(foodOrders.paidAt, new Date(Date.now() - SEAT_EDIT_WINDOW_MS))),
          and(eq(foodOrders.paymentStatus, "legacy"), gt(foodOrders.createdAt, new Date(Date.now() - SEAT_EDIT_WINDOW_MS))),
        ),
      ))
      .returning({ id: foodOrders.id, seat: foodOrders.seat });
    if (!order) {
      return NextResponse.json({ error: `The ${SEAT_EDIT_WINDOW_MS / 1000}-second seat edit window has ended.` }, { status: 403 });
    }
    return NextResponse.json({ order }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Food order seat update failed", error);
    return NextResponse.json({ error: "We could not update your seat. Please try again." }, { status: 500 });
  }
}
