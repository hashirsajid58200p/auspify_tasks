import { CourseBuilderView } from "@/components/instructor/builder/course-builder-view";

export const metadata = {
  title: "Course Builder | Instructor",
};

export default async function CourseBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseBuilderView courseId={id} />;
}
