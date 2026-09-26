import { apiHandler } from "@/server/http";
import {
  updateApplicationStatusSchema,
  UpdateApplicationStatusInput,
} from "@/validations/application";
import { transitionApplicationStatus } from "@/server/services/applications";

export const PATCH = apiHandler<UpdateApplicationStatusInput>(
  {
    auth: true,
    bodySchema: updateApplicationStatusSchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "application-status",
    },
  },
  async ({ user, body, params }) => {
    const applicationId = typeof params.id === "string" ? params.id : "";
    const updated = await transitionApplicationStatus(applicationId, body.status, user!);
    return {
      data: updated,
    };
  },
);
