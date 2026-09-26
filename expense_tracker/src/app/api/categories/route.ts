import { apiHandler } from "@/server/http";
import { listCategories, createCategory } from "@/server/services/category";
import {
  createCategorySchema,
  CreateCategoryInput,
} from "@/validations/category";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    const categories = await listCategories(user!.userId);
    return {
      data: categories,
    };
  }
);

export const POST = apiHandler<CreateCategoryInput>(
  {
    auth: true,
    bodySchema: createCategorySchema,
  },
  async ({ user, body }) => {
    const category = await createCategory(user!.userId, body);
    return {
      data: category,
      status: 201,
    };
  }
);
