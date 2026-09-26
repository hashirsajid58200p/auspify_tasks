import { apiHandler } from "@/server/http";
import { revokeUserSession } from "@/server/services/settings";

export const DELETE = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "me:sessions:revoke",
    },
  },
  async ({ user, params }) => {
    const sessionId = String(params.id || "");
    const result = await revokeUserSession(user!.userId, sessionId);
    return {
      data: result,
    };
  }
);
