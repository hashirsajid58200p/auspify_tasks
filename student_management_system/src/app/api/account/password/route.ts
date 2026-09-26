import { apiHandler } from "@/server/http";
import { changePasswordSchema, ChangePasswordInput } from "@/validations/auth";
import { changeUserPassword } from "@/server/services/auth";

export const POST = apiHandler<ChangePasswordInput>(
  {
    auth: true,
    bodySchema: changePasswordSchema,
    rateLimit: {
      maxPoints: 10,
      windowSeconds: 60,
      keyPrefix: "account-password",
    },
  },
  async ({ user, body }) => {
    if (!user) {
      throw new Error("User required");
    }

    const result = await changeUserPassword(user.userId, body.currentPassword, body.newPassword);

    return {
      data: result,
    };
  },
);
