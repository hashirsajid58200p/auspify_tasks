import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { loginSchema, LoginSchema } from "@/validations/auth";
import { authenticateUser } from "@/server/services/user";
import { setAuthCookies } from "@/server/auth/cookies";
import { getClientIp } from "@/server/rate-limit";

export const POST = apiHandler<LoginSchema>(
  {
    bodySchema: loginSchema,
    rateLimit: {
      maxPoints: 5,
      windowSeconds: 60,
      keyPrefix: "auth-login",
    },
  },
  async ({ req, body }) => {
    const userAgent = req.headers.get("user-agent") || undefined;
    const ip = getClientIp(req);

    const { user, accessToken, refreshToken } = await authenticateUser(body, {
      userAgent,
      ipHash: ip,
    });

    const res = NextResponse.json({
      data: user,
    });

    setAuthCookies(res, accessToken, refreshToken);
    return res;
  }
);
