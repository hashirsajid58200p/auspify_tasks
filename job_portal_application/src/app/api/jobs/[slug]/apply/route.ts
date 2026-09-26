import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { applyToJob } from "@/server/services/applications";
import { z } from "zod";

const applyBodySchema = z
  .object({
    coverLetter: z.string().trim().max(2000).optional().default(""),
  })
  .strict();

type ApplyBodyInput = z.infer<typeof applyBodySchema>;

export const POST = apiHandler<ApplyBodyInput>(
  {
    auth: true,
    bodySchema: applyBodySchema,
    rateLimit: {
      maxPoints: 15,
      windowSeconds: 60,
      keyPrefix: "job-apply",
    },
  },
  async ({ user, body, params }) => {
    requireRole(user, "JOB_SEEKER");
    const jobId = typeof params.slug === "string" ? params.slug : (params.id as string) || "";

    const application = await applyToJob(user!.userId, {
      jobId,
      coverLetter: body.coverLetter,
    });

    return {
      data: application,
      status: 201,
    };
  },
);
