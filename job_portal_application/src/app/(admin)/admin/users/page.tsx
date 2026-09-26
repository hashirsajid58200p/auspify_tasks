import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { UsersManager } from "@/components/admin/users-manager";

export const metadata: Metadata = {
  title: "Manage Users | Admin Console",
  description: "Search, moderate permissions, and toggle access states across all accounts.",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await requireServerUser(["ADMIN"]);

  return <UsersManager currentUserId={user.userId} />;
}
