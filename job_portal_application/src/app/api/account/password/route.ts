import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { changePassword } from "@/server/services/settings";
import { changePasswordSchema } from "@/validations/settings";
import { clearAuthCookies } from "@/server/auth/cookies";

export const POST = apiHandler(
  {
    auth: true,
    bodySchema: changePasswordSchema,
  },
  async ({ user, body }) => {
    await changePassword(user!.userId, body);

    const res = NextResponse.json({
      data: {
        message: "Password changed successfully. Please log in with your new password.",
      },
    });

    clearAuthCookies(res);
    return res;
  },
);
