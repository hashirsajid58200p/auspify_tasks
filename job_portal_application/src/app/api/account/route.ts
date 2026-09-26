import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { updateAccountName, deleteAccount } from "@/server/services/settings";
import { updateAccountSchema, deleteAccountSchema } from "@/validations/settings";
import { clearAuthCookies } from "@/server/auth/cookies";

export const PATCH = apiHandler(
  {
    auth: true,
    bodySchema: updateAccountSchema,
  },
  async ({ user, body }) => {
    const updated = await updateAccountName(user!.userId, body.name);
    return {
      data: updated,
    };
  },
);

export const DELETE = apiHandler(
  {
    auth: true,
    bodySchema: deleteAccountSchema,
  },
  async ({ user, body }) => {
    await deleteAccount(user!.userId, body?.password);

    const res = NextResponse.json({
      data: {
        message: "Account permanently deleted.",
      },
    });

    clearAuthCookies(res);
    return res;
  },
);
