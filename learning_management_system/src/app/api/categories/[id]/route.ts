import { z } from "zod";
import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { updateAdminCategory, deleteAdminCategory } from "@/server/services/admin";

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    slug: z.string().trim().min(1).max(60).optional(),
    description: z.string().trim().max(300).optional(),
  })
  .strict();

export const PATCH = apiHandler(
  {
    auth: true,
    bodySchema: updateCategorySchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "categories:patch",
    },
  },
  async ({ user, body, params }) => {
    requireRole(user, "ADMIN");
    const categoryId = String(params.id || "");
    const updated = await updateAdminCategory(user!.userId, categoryId, body);
    return {
      data: updated,
    };
  }
);

export const DELETE = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "categories:delete",
    },
  },
  async ({ user, params }) => {
    requireRole(user, "ADMIN");
    const categoryId = String(params.id || "");
    const result = await deleteAdminCategory(user!.userId, categoryId);
    return {
      data: result,
    };
  }
);
