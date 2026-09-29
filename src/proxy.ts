import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

async function signToken(payload: string): Promise<string> {
  if (!SESSION_SECRET) throw new Error("SESSION_SECRET is required for admin authentication");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Buffer.from(signature).toString("hex");
}

async function verifyToken(token: string, expectedPayload: string): Promise<boolean> {
  const expectedToken = await signToken(expectedPayload);
  return token === expectedToken;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("admin-session")?.value;

  if (!ADMIN_PASSWORD || !SESSION_SECRET) {
    if (pathname.startsWith("/api/admin")) return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
    return new NextResponse("Admin access is not configured.", { status: 503 });
  }

  if (pathname.startsWith("/api/admin")) {
    if (!authCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const valid = await verifyToken(authCookie, ADMIN_PASSWORD);
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!authCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const valid = await verifyToken(authCookie, ADMIN_PASSWORD);
    if (!valid) {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("admin-session");
      return response;
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
