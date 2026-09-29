import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

async function signToken(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Buffer.from(signature).toString("hex");
}

export async function POST(request: NextRequest) {
  if (!ADMIN_PASSWORD || !SESSION_SECRET) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }
  const { password } = await request.json();

  if (password === ADMIN_PASSWORD) {
    const token = await signToken(ADMIN_PASSWORD, SESSION_SECRET);
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
