import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { searchAdminJobs } from "@/server/services/admin";
import { adminJobsQuerySchema } from "@/validations/admin";

export const GET = apiHandler(
  {
    auth: true,
    querySchema: adminJobsQuerySchema,
  },
  async ({ user, query }) => {
    requireRole(user, "ADMIN");
    const result = await searchAdminJobs(query);
    return {
      data: result.jobs,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  },
);
