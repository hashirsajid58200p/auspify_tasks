import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  STUDENT_NAV_ITEMS,
  INSTRUCTOR_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
} from "@/components/layout/nav-config";
import { requireServerUser, getUserInitials } from "@/server/auth/server-session";

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireServerUser(["STUDENT", "INSTRUCTOR", "ADMIN"]);

  const navItems =
    user.role === "ADMIN"
      ? ADMIN_NAV_ITEMS
      : user.role === "INSTRUCTOR"
      ? INSTRUCTOR_NAV_ITEMS
      : STUDENT_NAV_ITEMS;

  const roleBadgeColor =
    user.role === "ADMIN"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : user.role === "INSTRUCTOR"
      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      : "bg-primary/10 text-primary border-primary/20";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-20">
        <Sidebar items={navItems} roleLabel={user.role} roleBadgeColor={roleBadgeColor} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64">
        <DashboardHeader
          navItems={navItems}
          roleLabel={user.role}
          userName={user.name}
          userEmail={user.email}
          userInitials={getUserInitials(user.name)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
