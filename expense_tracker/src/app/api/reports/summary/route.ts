import { apiHandler } from "@/server/http";
import { getSummaryMetrics } from "@/server/services/report";
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
    const summary = await getSummaryMetrics(
      user!.userId,
      query.startDate,
      query.endDate
    );
    return {
      data: summary,
    };
  }
);
