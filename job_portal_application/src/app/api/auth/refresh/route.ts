import { NextResponse } from "next/server";
import { rotateSession } from "@/server/auth/session";
import {
  getRefreshTokenFromRequest,
  setAuthCookies,
  clearAuthCookies,
} from "@/server/auth/cookies";
import { getClientIp } from "@/server/rate-limit";

export async function POST(req: Request) {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) {
    const res = NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Missing refresh token cookie",
        },
      },
      { status: 401 },
    );
    clearAuthCookies(res);
    return res;
  }

  try {
    const userAgent = req.headers.get("user-agent") || undefined;
    const ip = getClientIp(req);

    const tokens = await rotateSession(refreshToken, {
      userAgent,
      ipHash: ip,
    });

    const res = NextResponse.json({
      data: tokens.user,
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid or expired session";
    const res = NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message,
        },
      },
      { status: 401 },
    );
    clearAuthCookies(res);
    return res;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawNext = url.searchParams.get("next") || "/dashboard";

  // Prevent open redirects: must be a relative path starting with /
  const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) {
    const res = NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(safeNext)}`, req.url),
    );
    clearAuthCookies(res);
    return res;
  }

  try {
    const userAgent = req.headers.get("user-agent") || undefined;
    const ip = getClientIp(req);

    const tokens = await rotateSession(refreshToken, {
      userAgent,
      ipHash: ip,
    });

    const res = NextResponse.redirect(new URL(safeNext, req.url));
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return res;
  } catch {
    const res = NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(safeNext)}`, req.url),
    );
    clearAuthCookies(res);
    return res;
  }
}
