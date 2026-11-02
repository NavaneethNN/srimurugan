import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { foodOrders, type OrderStatusLog } from "@/lib/schema";
import { authenticatedCafeUser } from "@/lib/cafeSession";
import { verifyAdminSession } from "@/lib/adminSession";

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  preparing: ["pending"],
  completed: ["preparing"],
  cancelled: ["pending", "preparing"],
};

export type OrderActor = {
  type: "staff" | "admin" | "customer" | "system";
  name: string;
  id?: number;
};

export async function resolveActorFromRequest(
  request: Request,
  bodyStaffName?: string
): Promise<OrderActor> {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => c.trim().split("="))
      .filter((parts) => parts.length >= 2)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
  );

  // 1. Check cafe staff session
  const cafeToken = cookies["cafe-session"];
  if (cafeToken) {
    try {
      const user = await authenticatedCafeUser(cafeToken);
      if (user) {
        return {
          type: "staff",
          id: user.id,
          name: user.name,
        };
      }
    } catch {
      // Continue to next check
    }
  }

  // 2. Check admin session
  const adminToken = cookies["admin-session"];
  if (
    adminToken &&
    process.env.ADMIN_PASSWORD &&
    process.env.SESSION_SECRET &&
    verifyAdminSession(adminToken, process.env.ADMIN_PASSWORD, process.env.SESSION_SECRET)
  ) {
    return {
      type: "admin",
      name: bodyStaffName?.trim() || "Admin",
    };
  }

  // 3. Client explicitly provided staffName (e.g. from POS context)
  if (bodyStaffName && bodyStaffName.trim().length > 0) {
    return {
      type: "staff",
      name: bodyStaffName.trim().slice(0, 120),
    };
  }

  return {
    type: "staff",
    name: "Staff Member",
  };
}

export type UpdateOrderOptions = {
  orderId: number;
  nextStatus: string;
  actor: OrderActor;
  note?: string;
  reason?: string;
};

export async function updateOrderStatus({
  orderId,
  nextStatus,
  actor,
  note,
  reason,
}: UpdateOrderOptions) {
  if (
    !Number.isSafeInteger(orderId) ||
    orderId < 1 ||
    typeof nextStatus !== "string" ||
    !ORDER_TRANSITIONS[nextStatus]
  ) {
    return { error: "Invalid order or status transition.", status: 400 };
  }

  const db = getDb();

  // Find the order
  const [currentOrder] = await db
    .select()
    .from(foodOrders)
    .where(
      and(
        eq(foodOrders.id, orderId),
        eq(foodOrders.paymentStatus, "paid"),
        isNotNull(foodOrders.paidAt),
        isNotNull(foodOrders.razorpayPaymentId)
      )
    )
    .limit(1);

  if (!currentOrder) {
    return { error: "Order not found or payment not confirmed.", status: 404 };
  }

  const allowedPriorStatuses = ORDER_TRANSITIONS[nextStatus];
  if (!allowedPriorStatuses.includes(currentOrder.status)) {
    return {
      error: `Order #${orderId} is currently "${currentOrder.status}" and cannot transition to "${nextStatus}".`,
      status: 409,
    };
  }

  const now = new Date();
  const timestampIso = now.toISOString();

  // Initialize or copy existing status logs
  const existingLogs: OrderStatusLog[] =
    Array.isArray(currentOrder.statusLogs) && currentOrder.statusLogs.length > 0
      ? [...currentOrder.statusLogs]
      : [
          {
            action: "placed",
            status: "pending",
            actorType: "customer",
            actorName: currentOrder.customerName?.trim() || "Customer",
            timestamp: (currentOrder.paidAt || currentOrder.createdAt).toISOString(),
            note: `Order placed online · Delivering to ${currentOrder.seat}`,
          },
        ];

  // Determine action and specific note based on nextStatus
  let action: OrderStatusLog["action"] = "accepted";
  let eventNote = note?.trim();

  if (nextStatus === "preparing") {
    action = "accepted";
    eventNote = eventNote || `Order accepted and preparation started by staff: ${actor.name}`;
  } else if (nextStatus === "completed") {
    action = "completed";
    eventNote = eventNote || `Order fulfilled and delivered to seat by staff: ${actor.name}`;
  } else if (nextStatus === "cancelled") {
    action = "cancelled";
    eventNote =
      reason?.trim()
        ? `Order cancelled by staff: ${actor.name} (Reason: ${reason.trim()})`
        : eventNote || `Order cancelled by staff: ${actor.name}`;
  }

  const newLogEntry: OrderStatusLog = {
    action,
    status: nextStatus,
    actorType: actor.type,
    actorName: actor.name,
    actorId: actor.id,
    timestamp: timestampIso,
    note: eventNote,
  };

  existingLogs.push(newLogEntry);

  // Build the update payload
  const updateFields: Partial<typeof foodOrders.$inferInsert> = {
    status: nextStatus,
    updatedAt: now,
    statusLogs: existingLogs,
  };

  if (nextStatus === "preparing") {
    updateFields.acceptedBy = actor.name;
    updateFields.acceptedAt = now;
  } else if (nextStatus === "completed") {
    updateFields.completedBy = actor.name;
    updateFields.completedAt = now;
  } else if (nextStatus === "cancelled") {
    updateFields.cancelledBy = actor.name;
    updateFields.cancelledAt = now;
  }

  // Concurrency guard: Ensure status hasn't changed since we read it
  const [updated] = await db
    .update(foodOrders)
    .set(updateFields)
    .where(
      and(
        eq(foodOrders.id, orderId),
        eq(foodOrders.status, currentOrder.status),
        eq(foodOrders.paymentStatus, "paid")
      )
    )
    .returning();

  if (!updated) {
    return {
      error: "Order was updated concurrently by another staff member. Please refresh the queue.",
      status: 409,
    };
  }

  return { order: updated, status: 200 };
}
