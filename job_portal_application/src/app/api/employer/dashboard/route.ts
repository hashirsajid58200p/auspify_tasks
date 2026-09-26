import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { getEmployerDashboardData } from "@/server/services/dashboards";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    requireRole(user, "EMPLOYER");
    const data = await getEmployerDashboardData(user!.userId);
    return {
      data,
    };
  },
);
