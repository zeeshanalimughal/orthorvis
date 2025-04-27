import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    authRoutes.some((route) => pathname === route || pathname === `${route}/`)
  ) {
    const authToken = request.cookies.get("token")?.value;
    const isAuthenticated = !!authToken;

    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/login/", "/register", "/register/"],
};
