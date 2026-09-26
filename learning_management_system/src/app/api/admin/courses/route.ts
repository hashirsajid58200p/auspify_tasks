import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { getAdminCourses } from "@/server/services/admin";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "admin:courses",
    },
  },
  async ({ user, req }) => {
    requireRole(user, "ADMIN");

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    const result = await getAdminCourses({ search, status, page, limit });
    return {
      data: result.data,
      meta: result.meta,
    };
  }
);
