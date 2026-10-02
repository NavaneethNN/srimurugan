import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafeUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/adminSession";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin-session");
    
    if (!ADMIN_PASSWORD || !SESSION_SECRET || !verifyAdminSession(adminSession?.value, ADMIN_PASSWORD, SESSION_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await db.select({
      id: cafeUsers.id,
      name: cafeUsers.name,
      pin: cafeUsers.pin,
      isActive: cafeUsers.isActive,
      lastLoginAt: cafeUsers.lastLoginAt,
      createdAt: cafeUsers.createdAt,
    })
    .from(cafeUsers)
    .orderBy(cafeUsers.name);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching cafe users:", error);
    return NextResponse.json({ error: "Failed to fetch cafe users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin-session");
    
    if (!ADMIN_PASSWORD || !SESSION_SECRET || !verifyAdminSession(adminSession?.value, ADMIN_PASSWORD, SESSION_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, pin } = await request.json();

    if (!name || !pin) {
      return NextResponse.json({ error: "Name and PIN are required" }, { status: 400 });
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
    }

    const [user] = await db.insert(cafeUsers)
      .values({ name, pin })
      .returning();

    return NextResponse.json({ user });
  } catch (error: unknown) {
    console.error("Error creating cafe user:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "PIN already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create cafe user" }, { status: 500 });
  }
}
