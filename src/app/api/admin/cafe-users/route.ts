import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cafeUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/adminSession";
import { hashPin, verifyPin } from "@/lib/cafeAuth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin-session");
    
    if (!ADMIN_PASSWORD || !SESSION_SECRET || !verifyAdminSession(adminSession?.value, ADMIN_PASSWORD, SESSION_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await getDb().select({
      id: cafeUsers.id,
      name: cafeUsers.name,
      isActive: cafeUsers.isActive,
      lastLoginAt: cafeUsers.lastLoginAt,
      createdAt: cafeUsers.createdAt,
      updatedAt: cafeUsers.updatedAt,
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

    if (!name || typeof name !== "string" || !name.trim() || !pin || typeof pin !== "string") {
      return NextResponse.json({ error: "Name and PIN are required" }, { status: 400 });
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
    }

    const db = getDb();
    const activeUsers = await db.select({
      id: cafeUsers.id,
      name: cafeUsers.name,
      pin: cafeUsers.pin,
    })
    .from(cafeUsers)
    .where(eq(cafeUsers.isActive, true));

    const duplicate = activeUsers.find((u) => verifyPin(pin, u.pin));
    if (duplicate) {
      return NextResponse.json(
        { error: `This PIN is already assigned to "${duplicate.name}". Each staff member must have a unique PIN.` },
        { status: 409 }
      );
    }

    const hashedPin = hashPin(pin);
    const [user] = await db.insert(cafeUsers)
      .values({ name: name.trim(), pin: hashedPin })
      .returning({
        id: cafeUsers.id,
        name: cafeUsers.name,
        isActive: cafeUsers.isActive,
        lastLoginAt: cafeUsers.lastLoginAt,
        createdAt: cafeUsers.createdAt,
        updatedAt: cafeUsers.updatedAt,
      });

    return NextResponse.json({ user });
  } catch (error: unknown) {
    console.error("Error creating cafe user:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "PIN already exists" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Failed to create cafe user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
