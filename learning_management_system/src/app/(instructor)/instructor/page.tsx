import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { getInstructorDashboardData } from "@/server/services/instructor-analytics";
import { InstructorDashboardView } from "@/components/instructor/instructor-dashboard-view";

export const metadata: Metadata = {
  title: "Instructor Dashboard | EduFlow LMS",
  description: "Track student retention, grading queues, and academic quiz performance.",
};

export default async function InstructorDashboardPage() {
  const user = await requireServerUser(["INSTRUCTOR", "ADMIN"]);
  const data = await getInstructorDashboardData(user.userId);

  return <InstructorDashboardView initialData={data} />;
}
