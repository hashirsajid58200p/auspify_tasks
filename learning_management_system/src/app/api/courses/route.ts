import { apiHandler } from "@/server/http";
import { catalogQuerySchema, CatalogQuerySchema } from "@/validations/course";
import { getCatalogCourses } from "@/server/services/catalog";

export const GET = apiHandler<unknown, CatalogQuerySchema>(
  {
    auth: false,
    querySchema: catalogQuerySchema,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "courses:catalog",
    },
  },
  async ({ query }) => {
    const result = await getCatalogCourses(query);
    return {
      data: result.courses,
      meta: result.meta,
    };
  }
);
