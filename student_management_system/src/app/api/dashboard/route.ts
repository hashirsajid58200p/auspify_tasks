import { apiHandler } from "@/server/http";
import { getDashboardMetrics } from "@/server/services/dashboard";

export const GET = apiHandler(
  {
    auth: true,
  },
  async () => {
    const data = await getDashboardMetrics();
    return {
      data,
    };
  },
);
