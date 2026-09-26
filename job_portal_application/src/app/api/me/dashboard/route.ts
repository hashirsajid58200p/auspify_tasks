import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { getSeekerDashboardData } from "@/server/services/dashboards";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    requireRole(user, "JOB_SEEKER");
    const data = await getSeekerDashboardData(user!.userId);
    return {
      data,
    };
  },
);
