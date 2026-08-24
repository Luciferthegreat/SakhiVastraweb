import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const adminCookie = request.cookies.get("malik_admin");

  console.log(
    "🔥 MIDDLEWARE:",
    request.nextUrl.pathname,
    "COOKIE:",
    adminCookie?.value
  );

  // Agar login nahi hai to /malik par bhejo
  if (!adminCookie || adminCookie.value !== "authenticated") {
    return NextResponse.redirect(new URL("/malik", request.url));
  }

  // Login hai → /sync open hone do
  return NextResponse.next();
}

export const config = {
  matcher: ["/sync/:path*"],
};