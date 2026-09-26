import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ADMIN_NAV_ITEMS } from "@/components/layout/nav-config";
import { requireServerUser, getUserInitials } from "@/server/auth/server-session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireServerUser(["ADMIN"]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-20">
        <Sidebar
          items={ADMIN_NAV_ITEMS}
          roleLabel="ADMIN"
          roleBadgeColor="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64">
        <DashboardHeader
          navItems={ADMIN_NAV_ITEMS}
          roleLabel="ADMIN"
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
