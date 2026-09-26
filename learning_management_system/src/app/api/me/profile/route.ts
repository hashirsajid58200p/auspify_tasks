import { z } from "zod";
import { apiHandler } from "@/server/http";
import { updateUserProfile } from "@/server/services/settings";

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100).optional(),
    bio: z.string().trim().max(500, "Bio cannot exceed 500 characters").optional(),
  })
  .strict();

export const PATCH = apiHandler(
  {
    auth: true,
    bodySchema: updateProfileSchema,
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "me:profile:update",
    },
  },
  async ({ user, body }) => {
    const updated = await updateUserProfile(user!.userId, body);
    return {
      data: updated,
    };
  }
);
