import { apiHandler, NotFoundError } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { updateUserStatusAndRole } from "@/server/services/admin";
import { updateUserSchema } from "@/validations/admin";
import { User } from "@/server/models/user";
import { Types } from "mongoose";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    requireRole(user, "ADMIN");
    const targetId = params.id as string;
    if (!Types.ObjectId.isValid(targetId)) {
      throw new NotFoundError("User not found");
    }

    const targetUser = await User.findById(targetId).select("-passwordHash").lean();
    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    return {
      data: targetUser,
    };
  },
);

export const PATCH = apiHandler(
  {
    auth: true,
    bodySchema: updateUserSchema,
  },
  async ({ user, params, body }) => {
    requireRole(user, "ADMIN");
    const targetId = params.id as string;
    const updated = await updateUserStatusAndRole(user!.userId, targetId, body);
    return {
      data: updated,
    };
  },
);
