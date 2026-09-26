import { apiHandler } from "@/server/http";
import { updateCategory, deleteCategory } from "@/server/services/category";
import {
  updateCategorySchema,
  deleteCategorySchema,
  UpdateCategoryInput,
  DeleteCategoryInput,
} from "@/validations/category";

export const PATCH = apiHandler<UpdateCategoryInput>(
  {
    auth: true,
    bodySchema: updateCategorySchema,
  },
  async ({ user, params, body }) => {
    const categoryId = Array.isArray(params.id) ? params.id[0] : params.id;
    const updated = await updateCategory(user!.userId, categoryId, body);
    return {
      data: updated,
    };
  }
);

export const DELETE = apiHandler<unknown, DeleteCategoryInput>(
  {
    auth: true,
    querySchema: deleteCategorySchema,
  },
  async ({ user, params, query }) => {
    const categoryId = Array.isArray(params.id) ? params.id[0] : params.id;
    await deleteCategory(user!.userId, categoryId, query.reassignToCategoryId);
    return {
      data: { success: true },
    };
  }
);
