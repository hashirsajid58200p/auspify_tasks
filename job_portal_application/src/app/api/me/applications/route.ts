import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { getSeekerApplications } from "@/server/services/applications";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    requireRole(user, "JOB_SEEKER");
    const applications = await getSeekerApplications(user!.userId);
    return {
      data: applications,
    };
  },
);
