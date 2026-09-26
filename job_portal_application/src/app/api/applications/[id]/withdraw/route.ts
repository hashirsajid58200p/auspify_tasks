import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { withdrawApplication } from "@/server/services/applications";

export const POST = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "application-withdraw",
    },
  },
  async ({ user, params }) => {
    requireRole(user, "JOB_SEEKER");
    const applicationId = typeof params.id === "string" ? params.id : "";
    const updated = await withdrawApplication(applicationId, user!);
    return {
      data: updated,
    };
  },
);
