import { apiHandler, NotFoundError } from "@/server/http";
import { getCourseCurriculumForLearning } from "@/server/services/learning";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "courses:learn",
    },
  },
  async ({ user, params }) => {
    const courseId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!courseId) {
      throw new NotFoundError("Course not found");
    }

    const result = await getCourseCurriculumForLearning(user!, courseId);
    return {
      data: result,
    };
  }
);
