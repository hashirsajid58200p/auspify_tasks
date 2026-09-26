import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { seekerNavItems } from "@/components/layout/nav-config";
import { requireServerUser, getUserInitials } from "@/server/auth/server-session";

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireServerUser(["JOB_SEEKER"]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50/50 dark:bg-neutral-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 h-full">
        <Sidebar items={seekerNavItems} roleLabel="Seeker" roleBadgeVariant="blue" />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          navItems={seekerNavItems}
          roleLabel="Job Seeker"
          userName={user.name}
          userEmail={user.email}
          userInitials={getUserInitials(user.name)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
