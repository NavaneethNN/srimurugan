import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafeUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
    }

    const [user] = await db.select()
      .from(cafeUsers)
      .where(eq(cafeUsers.pin, pin))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account inactive" }, { status: 403 });
    }

    // Update last login
    await db.update(cafeUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(cafeUsers.id, user.id));

    const response = NextResponse.json({ 
      user: { id: user.id, name: user.name } 
    });

    // Set session cookie
    response.cookies.set("cafe-session", `${user.id}:${pin}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("Cafe login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("cafe-session");
  return response;
}
