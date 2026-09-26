import { redirect } from "next/navigation";
import { requireServerUser } from "@/server/auth/server-session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireServerUser();

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar userRole={user.role} userName={user.name} userEmail={user.email} />

      {/* Main View Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar userRole={user.role} userName={user.name} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav userRole={user.role} />
    </div>
  );
}
