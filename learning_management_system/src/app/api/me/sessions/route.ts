import { apiHandler } from "@/server/http";
import { getUserSessions } from "@/server/services/settings";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "me:sessions",
    },
  },
  async ({ user }) => {
    const sessions = await getUserSessions(user!.userId);
    return {
      data: sessions,
    };
  }
);
