import { requireServerUser } from "@/server/auth/server-session";

export default async function StudentRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServerUser(["STUDENT", "INSTRUCTOR", "ADMIN"]);
  return <div className="min-h-screen bg-background">{children}</div>;
}
