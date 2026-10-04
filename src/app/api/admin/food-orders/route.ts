import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, gt, inArray, isNotNull, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";

const statuses = ["pending", "preparing", "completed", "cancelled", "active", "all"] as const;

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || "pending";
  const cursorText = request.nextUrl.searchParams.get("cursor");
  const cursor = cursorText ? Number(cursorText) : null;
  const limitText = request.nextUrl.searchParams.get("limit");
  const limit = limitText ? Number(limitText) : 50;
  if (!statuses.includes(status as (typeof statuses)[number]) ||
      (cursor !== null && (!Number.isSafeInteger(cursor) || cursor < 1)) ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ error: "Invalid order filter." }, { status: 400 });
  }
  try {
    const db = getDb();
    const oldestFirst = status === "pending" || status === "preparing" || status === "active";
    const visible = and(eq(foodOrders.paymentStatus, "paid"), isNotNull(foodOrders.paidAt), isNotNull(foodOrders.razorpayPaymentId))!;
    const conditions = [visible];
    if (status === "active") conditions.push(inArray(foodOrders.status, ["pending", "preparing"]));
    else if (status !== "all") conditions.push(eq(foodOrders.status, status));
    if (cursor !== null) conditions.push(oldestFirst ? gt(foodOrders.id, cursor) : lt(foodOrders.id, cursor));
    const [rows, totals] = await Promise.all([
      db.select().from(foodOrders).where(and(...conditions))
        .orderBy(oldestFirst ? asc(foodOrders.id) : desc(foodOrders.id)).limit(limit + 1),
      db.select({ status: foodOrders.status, total: count() }).from(foodOrders).where(visible).groupBy(foodOrders.status),
    ]);
    const orders = rows.slice(0, limit);
    const counts = Object.fromEntries(totals.map((row) => [row.status, row.total]));
    return NextResponse.json({
      orders,
      counts,
      nextCursor: rows.length > limit ? orders[orders.length - 1].id : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load food orders", error);
    return NextResponse.json({ error: "Unable to load orders." }, { status: 500 });
  }
}
