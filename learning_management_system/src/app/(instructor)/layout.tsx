import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { INSTRUCTOR_NAV_ITEMS } from "@/components/layout/nav-config";
import { requireServerUser, getUserInitials } from "@/server/auth/server-session";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireServerUser(["INSTRUCTOR"]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-20">
        <Sidebar
          items={INSTRUCTOR_NAV_ITEMS}
          roleLabel="INSTRUCTOR"
          roleBadgeColor="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64">
        <DashboardHeader
          navItems={INSTRUCTOR_NAV_ITEMS}
          roleLabel="INSTRUCTOR"
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
