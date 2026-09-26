import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { getUserEnrollments } from "@/server/services/enrollments";
import { MyCoursesView } from "@/components/student/my-courses-view";

export const metadata: Metadata = {
  title: "My Courses | EduFlow LMS",
};

export default async function MyCoursesPage() {
  const user = await requireServerUser(["STUDENT"]);
  const enrollments = await getUserEnrollments(user.userId);

  return <MyCoursesView initialCourses={enrollments} />;
}
