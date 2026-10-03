import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafeUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createCafeSession } from "@/lib/cafeSession";
import { readJsonBody, RequestTooLargeError } from "@/lib/requestBody";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, 1_024) as { pin?: unknown } | null;
    const pin = body?.pin;

    if (typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
    }
    if (!process.env.SESSION_SECRET) return NextResponse.json({ error: "Cafe access is unavailable." }, { status: 503 });

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
    response.cookies.set("cafe-session", createCafeSession(user.id, process.env.SESSION_SECRET), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours
      path: "/"
    });

    return response;
  } catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    console.error("Cafe login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("cafe-session");
  return response;
}
