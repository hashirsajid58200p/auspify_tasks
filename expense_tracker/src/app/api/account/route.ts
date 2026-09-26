import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { updateProfile, deleteAccount } from "@/server/services/account";
import { getUserProfile } from "@/server/services/user";
import {
  updateProfileSchema,
  deleteAccountSchema,
  UpdateProfileInput,
  DeleteAccountInput,
} from "@/validations/account";
import { clearAuthCookies } from "@/server/auth/cookies";

export const GET = apiHandler({
  auth: true,
}, async ({ user }) => {
  const profile = await getUserProfile(user!.userId);
  return {
    data: profile,
  };
});

export const PATCH = apiHandler<UpdateProfileInput>(
  {
    auth: true,
    bodySchema: updateProfileSchema,
  },
  async ({ user, body }) => {
    const updated = await updateProfile(user!.userId, body);
    return {
      data: updated,
    };
  }
);

export const DELETE = apiHandler<DeleteAccountInput>(
  {
    auth: true,
    bodySchema: deleteAccountSchema,
  },
  async ({ user, body }) => {
    await deleteAccount(user!.userId, body.password);

    const res = NextResponse.json({
      data: { success: true },
    });
    clearAuthCookies(res);
    return res;
  }
);
