import { NextResponse } from "next/server";

export const ACCESS_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Secure-access_token" : "access_token";

export const REFRESH_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Secure-refresh_token" : "refresh_token";

export const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes in seconds
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string): void {
  const isProd = process.env.NODE_ENV === "production";

  // Access Token Cookie (Lax, Path=/)
  res.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  // Refresh Token Cookie (Strict, Path=/api/auth)
  res.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  const isProd = process.env.NODE_ENV === "production";

  res.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 0,
  });
}

export function getAccessTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${ACCESS_COOKIE_NAME}=`)) {
      return decodeURIComponent(cookie.substring(ACCESS_COOKIE_NAME.length + 1));
    }
  }
  return null;
}

export function getRefreshTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${REFRESH_COOKIE_NAME}=`)) {
      return decodeURIComponent(cookie.substring(REFRESH_COOKIE_NAME.length + 1));
    }
  }
  return null;
}
