import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getRoleNavItems } from "@/components/layout/nav-config";
import { requireServerUser, getUserInitials } from "@/server/auth/server-session";

export default async function SharedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireServerUser();

  const navItems = getRoleNavItems(user.role);
  const roleLabel =
    user.role === "ADMIN" ? "Admin" : user.role === "EMPLOYER" ? "Employer" : "Seeker";
  const roleBadgeVariant =
    user.role === "ADMIN" ? "coral" : user.role === "EMPLOYER" ? "yellow" : "blue";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50/50 dark:bg-neutral-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 h-full">
        <Sidebar items={navItems} roleLabel={roleLabel} roleBadgeVariant={roleBadgeVariant} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          navItems={navItems}
          roleLabel={roleLabel}
          userName={user.name}
          userEmail={user.email}
          userInitials={getUserInitials(user.name)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
