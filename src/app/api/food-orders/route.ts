import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";
import { menuItems } from "@/lib/foodMenu";
import { createSeatEditToken, SEAT_EDIT_WINDOW_MS } from "@/lib/foodOrderEdit";

interface OrderItem {
  name: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Enter your name, seat and at least one menu item." }, { status: 400 });
    }
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const seat = typeof body.seat === "string" ? body.seat.trim() : "";
    const items: unknown[] = Array.isArray(body.items) ? body.items : [];
    const menuNames = new Set(menuItems.map((item) => item.name));
    const validItems = items.every((item): item is OrderItem => {
      if (!item || typeof item !== "object") return false;
      const entry = item as Partial<OrderItem>;
      return typeof entry.name === "string" && menuNames.has(entry.name) &&
        Number.isInteger(entry.quantity) && (entry.quantity ?? 0) > 0 && (entry.quantity ?? 0) <= 20;
    });

    if (!customerName || customerName.length > 120 || !seat || seat.length > 120 || !items.length || items.length > menuItems.length || !validItems || new Set((items as OrderItem[]).map((item) => item.name)).size !== items.length) {
      return NextResponse.json({ error: "Enter your name and screen and seat, then choose items from the menu." }, { status: 400 });
    }

    if (!process.env.SESSION_SECRET) {
      return NextResponse.json({ error: "Ordering is temporarily unavailable." }, { status: 503 });
    }
    const db = getDb();
    const [order] = await db
      .insert(foodOrders)
      .values({ customerName, seat, items })
      .returning({ id: foodOrders.id, status: foodOrders.status, createdAt: foodOrders.createdAt });

    const expiresAt = order.createdAt.getTime() + SEAT_EDIT_WINDOW_MS;
    return NextResponse.json({
      order: { id: order.id, status: order.status, customerName, seat, items, expiresAt },
      editToken: createSeatEditToken(order.id, expiresAt),
      editRemainingMs: Math.max(0, expiresAt - Date.now()),
      editWindowMs: SEAT_EDIT_WINDOW_MS,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Food order submission failed", error);
    return NextResponse.json({ error: "We could not send your order. Please try again." }, { status: 500 });
  }
}
