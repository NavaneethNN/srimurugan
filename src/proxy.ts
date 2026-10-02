import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminSession";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

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
    const valid = verifyAdminSession(authCookie, ADMIN_PASSWORD, SESSION_SECRET);
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!authCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const valid = verifyAdminSession(authCookie, ADMIN_PASSWORD, SESSION_SECRET);
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
