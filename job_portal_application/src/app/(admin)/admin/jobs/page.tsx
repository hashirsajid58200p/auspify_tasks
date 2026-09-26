import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { JobsModeration } from "@/components/admin/jobs-moderation";

export const metadata: Metadata = {
  title: "Job Moderation | Admin Console",
  description: "Inspect published and draft listings network-wide and moderate violations.",
};

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  await requireServerUser(["ADMIN"]);

  return <JobsModeration />;
}
