import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cafeUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/adminSession";
import { hashPin } from "@/lib/cafeAuth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin-session");
    
    if (!ADMIN_PASSWORD || !SESSION_SECRET || !verifyAdminSession(adminSession?.value, ADMIN_PASSWORD, SESSION_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }
    if (body.pin !== undefined && body.pin !== "") {
      if (typeof body.pin !== "string" || !/^\d{4,6}$/.test(body.pin)) {
        return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
      }
      updates.pin = hashPin(body.pin);
    }
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    updates.updatedAt = new Date();

    const [user] = await getDb().update(cafeUsers)
      .set(updates)
      .where(eq(cafeUsers.id, userId))
      .returning();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: { id: user.id, name: user.name, isActive: user.isActive } });
  } catch (error: unknown) {
    console.error("Error updating cafe user:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "PIN already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update cafe user" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin-session");
    
    if (!ADMIN_PASSWORD || !SESSION_SECRET || !verifyAdminSession(adminSession?.value, ADMIN_PASSWORD, SESSION_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const [deleted] = await getDb().delete(cafeUsers).where(eq(cafeUsers.id, userId)).returning({ id: cafeUsers.id });
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cafe user:", error);
    return NextResponse.json({ error: "Failed to delete cafe user" }, { status: 500 });
  }
}
