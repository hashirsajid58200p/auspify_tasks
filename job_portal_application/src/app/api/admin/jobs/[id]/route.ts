import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { moderateJob } from "@/server/services/admin";
import { moderateJobSchema } from "@/validations/admin";

export const PATCH = apiHandler(
  {
    auth: true,
    bodySchema: moderateJobSchema,
  },
  async ({ user, params, body }) => {
    requireRole(user, "ADMIN");
    const jobId = params.id as string;
    const updated = await moderateJob(user!.userId, jobId, body.action);
    return {
      data: updated,
    };
  },
);
