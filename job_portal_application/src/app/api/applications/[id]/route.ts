import { apiHandler } from "@/server/http";
import { getApplicationById } from "@/server/services/applications";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    const applicationId = typeof params.id === "string" ? params.id : "";
    const application = await getApplicationById(applicationId, user!);
    return {
      data: application,
    };
  },
);
