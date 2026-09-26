import { apiHandler } from "@/server/http";
import { getCategoryBreakdown } from "@/server/services/report";
import {
  reportFilterSchema,
  ReportFilterInput,
} from "@/validations/report";

export const GET = apiHandler<unknown, ReportFilterInput>(
  {
    auth: true,
    querySchema: reportFilterSchema,
  },
  async ({ user, query }) => {
    const breakdown = await getCategoryBreakdown(
      user!.userId,
      query.startDate,
      query.endDate
    );
    return {
      data: breakdown,
    };
  }
);
