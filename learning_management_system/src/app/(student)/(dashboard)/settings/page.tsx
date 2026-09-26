import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { getUserProfile } from "@/server/services/auth";
import { getUserSessions } from "@/server/services/settings";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Account Settings | EduFlow LMS",
  description: "Manage your personal profile, credentials, and active device sessions.",
};

export default async function SettingsPage() {
  const sessionUser = await requireServerUser(["STUDENT", "INSTRUCTOR", "ADMIN"]);
  const profile = await getUserProfile(sessionUser.userId);
  const activeSessions = await getUserSessions(sessionUser.userId);

  return (
    <SettingsView
      user={{
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        bio: profile.bio,
      }}
      initialSessions={activeSessions}
    />
  );
}
