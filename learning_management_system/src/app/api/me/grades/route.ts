import { apiHandler } from "@/server/http";
import { getStudentGrades } from "@/server/services/grades";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "me:grades",
    },
  },
  async ({ user }) => {
    const grades = await getStudentGrades(user!.userId);
    return {
      data: grades,
    };
  }
);
