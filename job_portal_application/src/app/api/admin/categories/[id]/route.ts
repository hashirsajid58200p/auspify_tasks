import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { adminUpdateCategory, adminDeleteCategory } from "@/server/services/admin";
import { updateCategorySchema } from "@/validations/admin";

export const PATCH = apiHandler(
  {
    auth: true,
    bodySchema: updateCategorySchema,
  },
  async ({ user, params, body }) => {
    requireRole(user, "ADMIN");
    const categoryId = params.id as string;
    const category = await adminUpdateCategory(user!.userId, categoryId, body);
    return {
      data: category,
    };
  },
);

export const DELETE = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    requireRole(user, "ADMIN");
    const categoryId = params.id as string;
    const result = await adminDeleteCategory(user!.userId, categoryId);
    return {
      data: result,
    };
  },
);
