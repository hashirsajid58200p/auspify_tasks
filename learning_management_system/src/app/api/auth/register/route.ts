import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { registerSchema, RegisterSchema } from "@/validations/auth";
import { registerUser } from "@/server/services/auth";
import { setAuthCookies } from "@/server/auth/cookies";
import { getClientIp } from "@/server/rate-limit";

export const POST = apiHandler<RegisterSchema>(
  {
    bodySchema: registerSchema,
    rateLimit: {
      maxPoints: 5,
      windowSeconds: 60,
      keyPrefix: "auth-register",
    },
  },
  async ({ req, body }) => {
    const userAgent = req.headers.get("user-agent") || undefined;
    const ip = getClientIp(req);

    const { user, accessToken, refreshToken, redirectUrl } = await registerUser(body, {
      userAgent,
      ipHash: ip,
    });

    const res = NextResponse.json(
      {
        data: {
          ...user,
          redirectUrl,
        },
      },
      { status: 201 }
    );

    setAuthCookies(res, accessToken, refreshToken);
    return res;
  }
);
