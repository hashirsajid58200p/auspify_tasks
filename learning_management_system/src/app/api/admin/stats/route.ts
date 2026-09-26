import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { getPlatformStats } from "@/server/services/admin";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "admin:stats",
    },
  },
  async ({ user }) => {
    requireRole(user, "ADMIN");
    const stats = await getPlatformStats();
    return {
      data: stats,
    };
  }
);
