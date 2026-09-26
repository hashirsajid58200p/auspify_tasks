import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { AuditLogsView } from "@/components/admin/audit-logs-view";

export const metadata: Metadata = {
  title: "Audit Log | Admin Console",
  description: "Inspect immutable audit log entries across the platform.",
};

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  await requireServerUser(["ADMIN"]);

  return <AuditLogsView />;
}
