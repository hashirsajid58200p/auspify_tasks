import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { getAdminAuditLogs } from "@/server/services/admin";
import { AdminAuditLogsView } from "@/components/admin/admin-audit-logs-view";

export const metadata: Metadata = {
  title: "Audit Logs | Admin Portal",
  description: "Immutable chronological ledger of administrative events and security operations.",
};

export default async function AdminAuditLogsPage() {
  await requireServerUser(["ADMIN"]);
  const { data: initialLogs, meta } = await getAdminAuditLogs({ page: 1, limit: 50 });

  return (
    <AdminAuditLogsView
      initialLogs={initialLogs as any}
      initialTotal={meta.total}
    />
  );
}
