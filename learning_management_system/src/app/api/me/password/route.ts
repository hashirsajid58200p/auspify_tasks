import { z } from "zod";
import { apiHandler } from "@/server/http";
import { changeUserPassword } from "@/server/services/settings";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
  })
  .strict();

export const POST = apiHandler(
  {
    auth: true,
    bodySchema: changePasswordSchema,
    rateLimit: {
      maxPoints: 5,
      windowSeconds: 60,
      keyPrefix: "me:password:change",
    },
  },
  async ({ user, body }) => {
    const result = await changeUserPassword(user!.userId, body);
    return {
      data: result,
    };
  }
);
