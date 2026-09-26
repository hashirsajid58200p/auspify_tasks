import { apiHandler } from "@/server/http";
import { seekerProfileSchema, SeekerProfileInput } from "@/validations/profile";
import { getSeekerProfile, upsertSeekerProfile } from "@/server/services/profiles";
import { requireRole } from "@/server/policies/roles";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    requireRole(user, "JOB_SEEKER");
    const profile = await getSeekerProfile(user!.userId);
    return {
      data: profile,
    };
  },
);

export const PUT = apiHandler<SeekerProfileInput>(
  {
    auth: true,
    bodySchema: seekerProfileSchema,
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "seeker-profile",
    },
  },
  async ({ user, body }) => {
    requireRole(user, "JOB_SEEKER");
    const profile = await upsertSeekerProfile(user!.userId, body);
    return {
      data: profile,
    };
  },
);
