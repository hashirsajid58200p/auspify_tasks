import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { getAdminAuditLogs } from "@/server/services/admin";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "admin:audit-logs",
    },
  },
  async ({ user, req }) => {
    requireRole(user, "ADMIN");

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "30", 10);

    const result = await getAdminAuditLogs({ action, page, limit });
    return {
      data: result.data,
      meta: result.meta,
    };
  }
);
