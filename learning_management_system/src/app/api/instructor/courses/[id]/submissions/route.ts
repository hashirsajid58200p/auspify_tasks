import { apiHandler, NotFoundError } from "@/server/http";
import { getCourseSubmissionsQueue } from "@/server/services/submissions";

export const GET = apiHandler(
  {
    auth: true,
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

    const queue = await getCourseSubmissionsQueue(user!, courseId);
    return {
      data: queue,
    };
  }
);
