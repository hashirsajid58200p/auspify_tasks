import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Account Settings | Job Portal",
  description: "Manage your credentials, active device sessions, and account settings.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireServerUser();

  return (
    <SettingsView
      initialUser={{
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        isDemo: user.isDemo,
      }}
    />
  );
}
