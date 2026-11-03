import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
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
    const db = getDb();
    const [existing] = await db
      .select()
      .from(foodOrders)
      .where(
        and(
          eq(foodOrders.id, orderId),
          eq(foodOrders.paymentStatus, "paid"),
          gt(foodOrders.paidAt, new Date(Date.now() - SEAT_EDIT_WINDOW_MS))
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: `The ${SEAT_EDIT_WINDOW_MS / 1000}-second seat edit window has ended.` },
        { status: 403 }
      );
    }

    if (existing.status !== "pending") {
      return NextResponse.json(
        {
          error: "The kitchen staff has already accepted your order and printed your ticket. Seat changes are no longer allowed.",
          status: existing.status,
        },
        { status: 409 }
      );
    }

    const now = new Date();
    const logs = Array.isArray(existing.statusLogs) && existing.statusLogs.length > 0
      ? [...existing.statusLogs]
      : [
          {
            action: "placed" as const,
            status: "pending",
            actorType: "customer" as const,
            actorName: existing.customerName?.trim() || "Customer",
            timestamp: (existing.paidAt || existing.createdAt).toISOString(),
            note: `Order placed online · Delivering to ${existing.seat}`,
          },
        ];

    logs.push({
      action: "seat_updated",
      status: existing.status,
      actorType: "customer",
      actorName: existing.customerName?.trim() || "Customer",
      timestamp: now.toISOString(),
      note: `Seat corrected from "${existing.seat}" to "${seat}"`,
    });

    const [order] = await db
      .update(foodOrders)
      .set({ seat, updatedAt: now, statusLogs: logs })
      .where(
        and(
          eq(foodOrders.id, orderId),
          eq(foodOrders.paymentStatus, "paid"),
          eq(foodOrders.status, "pending"),
          gt(foodOrders.paidAt, new Date(Date.now() - SEAT_EDIT_WINDOW_MS))
        )
      )
      .returning({ id: foodOrders.id, seat: foodOrders.seat, status: foodOrders.status });

    if (!order) {
      const [latest] = await db
        .select({ status: foodOrders.status })
        .from(foodOrders)
        .where(eq(foodOrders.id, orderId))
        .limit(1);

      if (latest && latest.status !== "pending") {
        return NextResponse.json(
          {
            error: "The kitchen staff has already accepted your order and printed your ticket. Seat changes are no longer allowed.",
            status: latest.status,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: `The ${SEAT_EDIT_WINDOW_MS / 1000}-second seat edit window has ended.` },
        { status: 403 }
      );
    }
    return NextResponse.json({ order }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Food order seat update failed", error);
    return NextResponse.json({ error: "We could not update your seat. Please try again." }, { status: 500 });
  }
}
