import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { getJobApplicants } from "@/server/services/applications";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    requireRole(user, "EMPLOYER");
    const jobId = typeof params.id === "string" ? params.id : "";
    const result = await getJobApplicants(jobId, user!.userId);
    return {
      data: result,
    };
  },
);
