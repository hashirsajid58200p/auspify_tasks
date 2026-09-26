import { apiHandler } from "@/server/http";
import { archiveEmployerJob } from "@/server/services/jobs";
import { requireRole } from "@/server/policies/roles";

export const POST = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "employer-archive-job",
    },
  },
  async ({ user, params }) => {
    requireRole(user, "EMPLOYER");
    const jobId = params.id as string;
    const job = await archiveEmployerJob(user!.userId, jobId);
    return {
      data: job,
    };
  },
);
