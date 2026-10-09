import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow login page itself
  if (pathname === "/malik") {
    return NextResponse.next();
  }

  const adminCookie = request.cookies.get("malik_admin");

  // If not authenticated, redirect to /malik login
  if (!adminCookie || adminCookie.value !== "authenticated") {
    return NextResponse.redirect(new URL("/malik", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/sync/:path*", "/malik/:path*"],
};