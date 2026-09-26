import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/my-courses",
  "/learn",
  "/quizzes",
  "/assignments",
  "/grades",
  "/certificates",
  "/settings",
  "/instructor",
  "/admin",
];

const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProd = process.env.NODE_ENV === "production";
  const accessCookieName = isProd ? "__Secure-access_token" : "access_token";
  const refreshCookieName = isProd ? "__Secure-refresh_token" : "refresh_token";

  const hasAccessToken = request.cookies.has(accessCookieName);
  const hasRefreshToken = request.cookies.has(refreshCookieName);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );

  // If already authenticated and visiting /login or /register, redirect to /dashboard
  if (isAuthPage && hasAccessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If accessing a protected route without valid access token
  if (isProtected && !hasAccessToken) {
    // If refresh token exists, redirect to refresh flow
    if (hasRefreshToken) {
      const refreshUrl = new URL("/api/auth/refresh", request.url);
      refreshUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(refreshUrl);
    }

    // Otherwise redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-courses/:path*",
    "/learn/:path*",
    "/quizzes/:path*",
    "/assignments/:path*",
    "/grades/:path*",
    "/certificates/:path*",
    "/settings/:path*",
    "/instructor/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};

export { proxy as middleware };
