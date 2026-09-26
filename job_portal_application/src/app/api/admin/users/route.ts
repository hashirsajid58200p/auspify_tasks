import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { searchAdminUsers } from "@/server/services/admin";
import { adminUsersQuerySchema } from "@/validations/admin";

export const GET = apiHandler(
  {
    auth: true,
    querySchema: adminUsersQuerySchema,
  },
  async ({ user, query }) => {
    requireRole(user, "ADMIN");
    const result = await searchAdminUsers(query);
    return {
      data: result.users,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  },
);
