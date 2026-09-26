import { apiHandler } from "@/server/http";
import {
  listBudgetsWithProgress,
  upsertBudget,
} from "@/server/services/budget";
import {
  upsertBudgetSchema,
  budgetQuerySchema,
  UpsertBudgetInput,
  BudgetQueryInput,
} from "@/validations/budget";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user, req }) => {
    const url = new URL(req.url);
    const rawMonth = url.searchParams.get("month") || undefined;
    const parsedQuery = budgetQuerySchema.parse({ month: rawMonth }) as BudgetQueryInput;

    const overview = await listBudgetsWithProgress(user!.userId, parsedQuery.month);
    return {
      data: overview,
    };
  }
);

export const PUT = apiHandler<UpsertBudgetInput>(
  {
    auth: true,
    bodySchema: upsertBudgetSchema,
  },
  async ({ user, body }) => {
    const budget = await upsertBudget(user!.userId, body);
    return {
      data: budget,
    };
  }
);
