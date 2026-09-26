import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { adminCreateCategory } from "@/server/services/admin";
import { getAllCategories } from "@/server/services/categories";
import { createCategorySchema } from "@/validations/admin";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    requireRole(user, "ADMIN");
    const categories = await getAllCategories();
    return {
      data: categories,
    };
  },
);

export const POST = apiHandler(
  {
    auth: true,
    bodySchema: createCategorySchema,
  },
  async ({ user, body }) => {
    requireRole(user, "ADMIN");
    const category = await adminCreateCategory(user!.userId, body);
    return {
      data: category,
      status: 201,
    };
  },
);
