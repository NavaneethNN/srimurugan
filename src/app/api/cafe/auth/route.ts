import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cafeUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createCafeSession } from "@/lib/cafeSession";
import { readJsonBody, RequestTooLargeError } from "@/lib/requestBody";
import { checkLoginRateLimit, clearLoginFailures, hashPin, recordFailedLogin, verifyPin } from "@/lib/cafeAuth";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const rateLimit = checkLoginRateLimit(ip, 5, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again in a minute." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await readJsonBody(request, 1_024) as { pin?: unknown } | null;
    const pin = body?.pin;

    if (typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
    }
    if (!process.env.SESSION_SECRET) return NextResponse.json({ error: "Cafe access is unavailable." }, { status: 503 });

    const db = getDb();
    const users = await db.select()
      .from(cafeUsers)
      .where(eq(cafeUsers.isActive, true));

    const matchedUser = users.find((user) => verifyPin(pin, user.pin));

    if (!matchedUser) {
      recordFailedLogin(ip, 60_000);
      // Small artificial delay to slow down automated attempts
      await new Promise((resolve) => setTimeout(resolve, 150));
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    clearLoginFailures(ip);

    // Auto-upgrade legacy plaintext PINs to secure hash on successful login
    if (!matchedUser.pin.startsWith("s1:")) {
      await db.update(cafeUsers)
        .set({ pin: hashPin(pin), lastLoginAt: new Date() })
        .where(eq(cafeUsers.id, matchedUser.id));
    } else {
      await db.update(cafeUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(cafeUsers.id, matchedUser.id));
    }

    const response = NextResponse.json({ 
      user: { id: matchedUser.id, name: matchedUser.name } 
    });

    response.cookies.set("cafe-session", createCafeSession(matchedUser.id, process.env.SESSION_SECRET), {
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
