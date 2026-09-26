import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { saveJobSchema, SaveJobInput } from "@/validations/saved-job";
import { saveJob, unsaveJob, getSavedJobs } from "@/server/services/saved-jobs";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    requireRole(user, "JOB_SEEKER");
    const savedJobs = await getSavedJobs(user!.userId);
    return {
      data: savedJobs,
    };
  },
);

export const POST = apiHandler<SaveJobInput>(
  {
    auth: true,
    bodySchema: saveJobSchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "saved-jobs-add",
    },
  },
  async ({ user, body }) => {
    requireRole(user, "JOB_SEEKER");
    const saved = await saveJob(user!.userId, body.jobId);
    return {
      data: saved,
      status: 201,
    };
  },
);

export const DELETE = apiHandler<SaveJobInput>(
  {
    auth: true,
    bodySchema: saveJobSchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "saved-jobs-remove",
    },
  },
  async ({ user, body }) => {
    requireRole(user, "JOB_SEEKER");
    const removed = await unsaveJob(user!.userId, body.jobId);
    return {
      data: { removed },
    };
  },
);
