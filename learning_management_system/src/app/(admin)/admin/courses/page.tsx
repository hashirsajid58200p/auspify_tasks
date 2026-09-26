import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { getAdminCourses } from "@/server/services/admin";
import { AdminCoursesView } from "@/components/admin/admin-courses-view";

export const metadata: Metadata = {
  title: "Course Moderation | Admin Portal",
  description: "Review, moderate, and manage published courses across instructors.",
};

export default async function AdminCoursesPage() {
  await requireServerUser(["ADMIN"]);
  const { data: initialCourses } = await getAdminCourses({ page: 1, limit: 50 });

  return <AdminCoursesView initialCourses={initialCourses as any} />;
}
