import { NextResponse } from "next/server";
import { getRefreshTokenFromRequest, clearAuthCookies } from "@/server/auth/cookies";
import { revokeSessionByJti } from "@/server/auth/session";
import { verifyRefreshToken } from "@/server/auth/tokens";

export async function POST(req: Request) {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      await revokeSessionByJti(payload.jti);
    } catch {
      // Ignore token parse/verify errors during logout
    }
  }

  const res = NextResponse.json({
    data: { success: true },
  });

  clearAuthCookies(res);
  return res;
}
