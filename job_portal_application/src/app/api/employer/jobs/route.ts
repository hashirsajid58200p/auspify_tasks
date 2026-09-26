import { apiHandler } from "@/server/http";
import {
  createJobSchema,
  CreateJobSchema,
  employerJobsQuerySchema,
  EmployerJobsQuerySchema,
} from "@/validations/job";
import { createJob, getEmployerJobs } from "@/server/services/jobs";
import { requireRole } from "@/server/policies/roles";

export const GET = apiHandler<unknown, EmployerJobsQuerySchema>(
  {
    auth: true,
    querySchema: employerJobsQuerySchema,
  },
  async ({ user, query }) => {
    requireRole(user, "EMPLOYER");
    const result = await getEmployerJobs(user!.userId, query);
    return {
      data: result.jobs,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  },
);

export const POST = apiHandler<CreateJobSchema>(
  {
    auth: true,
    bodySchema: createJobSchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "employer-create-job",
    },
  },
  async ({ user, body }) => {
    requireRole(user, "EMPLOYER");
    const job = await createJob(user!.userId, body);
    return {
      data: job,
      status: 201,
    };
  },
);
