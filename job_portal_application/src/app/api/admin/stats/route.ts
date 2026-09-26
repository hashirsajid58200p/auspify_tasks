import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { getPlatformStats } from "@/server/services/admin";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    requireRole(user, "ADMIN");
    const stats = await getPlatformStats();
    return {
      data: stats,
    };
  },
);
