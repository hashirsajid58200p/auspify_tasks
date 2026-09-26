import { apiHandler, NotFoundError } from "@/server/http";
import { getCourseBySlug } from "@/server/services/catalog";

export const GET = apiHandler(
  {
    auth: false,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "courses:detail",
    },
  },
  async ({ params }) => {
    const idOrSlug = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
    if (!idOrSlug) {
      throw new NotFoundError("Course not found");
    }

    const result = await getCourseBySlug(idOrSlug);
    return {
      data: result,
    };
  }
);
