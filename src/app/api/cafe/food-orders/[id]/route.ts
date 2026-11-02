import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders } from "@/lib/schema";
import { authenticatedCafeUser } from "@/lib/cafeSession";
import { updateOrderStatus } from "@/lib/orderStatusUpdate";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await authenticatedCafeUser(request.cookies.get("cafe-session")?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const orderId = Number(id);
  if (!Number.isSafeInteger(orderId) || orderId < 1) {
    return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  }

  try {
    const [order] = await getDb().select().from(foodOrders).where(eq(foodOrders.id, orderId)).limit(1);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Unable to fetch order", error);
    return NextResponse.json({ error: "Unable to fetch order." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await authenticatedCafeUser(request.cookies.get("cafe-session")?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const orderId = Number(id);
  const body = (await request.json().catch(() => null)) as {
    status?: string;
    note?: string;
    reason?: string;
  } | null;

  if (!Number.isSafeInteger(orderId) || orderId < 1 || !body || typeof body.status !== "string") {
    return NextResponse.json({ error: "Invalid order or status." }, { status: 400 });
  }

  try {
    const result = await updateOrderStatus({
      orderId,
      nextStatus: body.status,
      actor: {
        type: "staff",
        id: user.id,
        name: user.name,
      },
      note: body.note,
      reason: body.reason,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ order: result.order });
  } catch (error) {
    console.error("Unable to update food order from POS", error);
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }
}
