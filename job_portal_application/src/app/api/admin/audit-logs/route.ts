import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { getAuditLogs } from "@/server/services/audit";
import { auditLogsQuerySchema } from "@/validations/admin";

export const GET = apiHandler(
  {
    auth: true,
    querySchema: auditLogsQuerySchema,
  },
  async ({ user, query }) => {
    requireRole(user, "ADMIN");
    const result = await getAuditLogs(query);
    return {
      data: result.logs,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  },
);
