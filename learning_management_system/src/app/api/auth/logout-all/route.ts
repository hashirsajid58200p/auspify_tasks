import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { revokeAllUserSessions } from "@/server/auth/session";
import { clearAuthCookies } from "@/server/auth/cookies";

export const POST = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    if (user) {
      await revokeAllUserSessions(user.userId);
    }

    const res = NextResponse.json({
      data: { success: true },
    });

    clearAuthCookies(res);
    return res;
  }
);
