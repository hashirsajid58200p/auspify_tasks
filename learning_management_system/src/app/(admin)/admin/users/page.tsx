import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { getAdminUsers } from "@/server/services/admin";
import { AdminUsersView } from "@/components/admin/admin-users-view";

export const metadata: Metadata = {
  title: "User Management | Admin Portal",
  description: "Manage platform users, roles, and account statuses.",
};

export default async function AdminUsersPage() {
  const currentAdmin = await requireServerUser(["ADMIN"]);
  const { data: initialUsers, meta } = await getAdminUsers({ page: 1, limit: 30 });

  return (
    <AdminUsersView
      currentAdminId={currentAdmin.userId}
      initialUsers={initialUsers as any}
      initialTotal={meta.total}
    />
  );
}
