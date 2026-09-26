import { apiHandler } from "@/server/http";
import { getUserEnrollments } from "@/server/services/enrollments";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "me:enrollments",
    },
  },
  async ({ user }) => {
    const enrollments = await getUserEnrollments(user!.userId);
    return {
      data: enrollments,
    };
  }
);
