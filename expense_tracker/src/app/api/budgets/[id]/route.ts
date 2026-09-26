import { apiHandler, NotFoundError } from "@/server/http";
import { deleteBudget } from "@/server/services/budget";

export const DELETE = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    const budgetId = Array.isArray(params.id) ? params.id[0] : params.id;
    const deleted = await deleteBudget(user!.userId, budgetId);

    if (!deleted) {
      throw new NotFoundError("Budget not found");
    }

    return {
      data: { success: true },
    };
  }
);
