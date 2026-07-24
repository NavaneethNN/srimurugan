import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Murugan@123";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authCookie = request.cookies.get("admin-auth")?.value;
  const isAuthenticated = authCookie === "authenticated";

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/login") {
      return NextResponse.next();
    }
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
