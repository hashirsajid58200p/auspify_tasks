import { z } from "zod";
import { apiHandler, BadRequestError } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { updateUserRole, toggleUserStatus } from "@/server/services/admin";

const patchUserSchema = z
  .object({
    role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  })
  .strict();

export const PATCH = apiHandler(
  {
    auth: true,
    bodySchema: patchUserSchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "admin:users:patch",
    },
  },
  async ({ user, body, params }) => {
    requireRole(user, "ADMIN");

    const targetUserId = String(params.id || "");
    if (!body.role && !body.status) {
      throw new BadRequestError("Either role or status must be provided");
    }

    let updated = null;

    if (body.role) {
      updated = await updateUserRole(user!.userId, targetUserId, body.role);
    }

    if (body.status) {
      updated = await toggleUserStatus(user!.userId, targetUserId, body.status);
    }

    return {
      data: updated,
    };
  }
);
