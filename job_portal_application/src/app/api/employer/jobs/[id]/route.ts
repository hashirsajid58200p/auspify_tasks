import { apiHandler } from "@/server/http";
import { updateJobSchema, UpdateJobSchema } from "@/validations/job";
import { getEmployerJobById, updateEmployerJob, deleteEmployerJob } from "@/server/services/jobs";
import { requireRole } from "@/server/policies/roles";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    requireRole(user, "EMPLOYER");
    const jobId = params.id as string;
    const job = await getEmployerJobById(user!.userId, jobId);
    return {
      data: job,
    };
  },
);

export const PATCH = apiHandler<UpdateJobSchema>(
  {
    auth: true,
    bodySchema: updateJobSchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "employer-update-job",
    },
  },
  async ({ user, params, body }) => {
    requireRole(user, "EMPLOYER");
    const jobId = params.id as string;
    const job = await updateEmployerJob(user!.userId, jobId, body);
    return {
      data: job,
    };
  },
);

export const DELETE = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "employer-delete-job",
    },
  },
  async ({ user, params }) => {
    requireRole(user, "EMPLOYER");
    const jobId = params.id as string;
    const result = await deleteEmployerJob(user!.userId, jobId);
    return {
      data: result,
    };
  },
);
