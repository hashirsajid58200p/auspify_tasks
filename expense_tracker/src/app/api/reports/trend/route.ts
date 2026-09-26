import { apiHandler } from "@/server/http";
import { getMonthlyTrend } from "@/server/services/report";
import {
  trendFilterSchema,
  TrendFilterInput,
} from "@/validations/report";

export const GET = apiHandler<unknown, TrendFilterInput>(
  {
    auth: true,
    querySchema: trendFilterSchema,
  },
  async ({ user, query }) => {
    const trend = await getMonthlyTrend(user!.userId, query.months);
    return {
      data: trend,
    };
  }
);
