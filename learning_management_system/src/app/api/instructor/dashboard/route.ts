import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { getInstructorDashboardData } from "@/server/services/instructor-analytics";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "instructor:dashboard",
    },
  },
  async ({ user }) => {
    requireRole(user, "INSTRUCTOR", "ADMIN");
    const data = await getInstructorDashboardData(user!.userId);
    return {
      data,
    };
  }
);
