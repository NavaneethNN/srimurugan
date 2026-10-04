import { NextResponse } from "next/server";
import { and, asc, count, eq, inArray, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cafeUsers, foodOrders, foodProducts, movies, upcomingMovies } from "@/lib/schema";

export async function GET() {
  try {
    const db = getDb();
    const paid = and(eq(foodOrders.paymentStatus, "paid"), isNotNull(foodOrders.paidAt), isNotNull(foodOrders.razorpayPaymentId))!;
    const [orderCounts, queue, showing, upcoming, staff, products] = await db.batch([
      db.select({ status: foodOrders.status, total: count() }).from(foodOrders).where(paid).groupBy(foodOrders.status),
      db.select({ id: foodOrders.id, seat: foodOrders.seat, customerName: foodOrders.customerName,
        status: foodOrders.status, amountPaise: foodOrders.amountPaise, createdAt: foodOrders.createdAt,
        items: foodOrders.items })
        .from(foodOrders).where(and(paid, inArray(foodOrders.status, ["pending", "preparing"])))
        .orderBy(asc(foodOrders.status), asc(foodOrders.id)).limit(12),
      db.select({ total: count() }).from(movies).where(eq(movies.isNowShowing, true)),
      db.select({ total: count() }).from(upcomingMovies),
      db.select({ total: count() }).from(cafeUsers).where(eq(cafeUsers.isActive, true)),
      db.select({ total: count() }).from(foodProducts).where(eq(foodProducts.isAvailable, true)),
    ]);
    return NextResponse.json({
      orders: Object.fromEntries(orderCounts.map((row) => [row.status, row.total])),
      queue,
      movies: { showing: showing[0]?.total ?? 0, upcoming: upcoming[0]?.total ?? 0 },
      activeStaff: staff[0]?.total ?? 0,
      availableProducts: products[0]?.total ?? 0,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin overview failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Could not load the overview." }, { status: 503 });
  }
}
