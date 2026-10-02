import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_SECONDS, createAdminSession, isAdminPasswordValid } from "@/lib/adminSession";
import { readJsonBody, RequestTooLargeError } from "@/lib/requestBody";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

export async function POST(request: NextRequest) {
  if (!ADMIN_PASSWORD || !SESSION_SECRET) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }
  let body: unknown;
  try { body = await readJsonBody(request, 1_024); } catch (error) {
    return NextResponse.json({ error: error instanceof RequestTooLargeError ? "Request is too large." : "Invalid request." }, { status: error instanceof RequestTooLargeError ? 413 : 400 });
  }
  const password = (body as Record<string, unknown> | null)?.password;

  if (isAdminPasswordValid(password, ADMIN_PASSWORD)) {
    const token = createAdminSession(ADMIN_PASSWORD, SESSION_SECRET);
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_SESSION_SECONDS,
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
