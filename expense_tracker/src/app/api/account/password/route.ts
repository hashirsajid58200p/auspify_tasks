import { apiHandler } from "@/server/http";
import { changePassword } from "@/server/services/account";
import {
  changePasswordSchema,
  ChangePasswordInput,
} from "@/validations/account";
import { getRefreshTokenFromRequest } from "@/server/auth/cookies";
import { verifyRefreshToken } from "@/server/auth/tokens";

export const POST = apiHandler<ChangePasswordInput>(
  {
    auth: true,
    bodySchema: changePasswordSchema,
  },
  async ({ user, body, req }) => {
    let currentFamilyId: string | undefined;
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) {
      try {
        const payload = await verifyRefreshToken(refreshToken);
        currentFamilyId = payload.familyId;
      } catch {
        // Fallback: revoke all if current refresh token is unreadable
      }
    }

    await changePassword(user!.userId, body, currentFamilyId);
    return {
      data: {
        success: true,
        message: "Password updated successfully. All other sessions revoked.",
      },
    };
  }
);
