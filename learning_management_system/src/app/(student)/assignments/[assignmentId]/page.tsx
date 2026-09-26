import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { AssignmentView } from "@/components/student/assignment-view";

interface AssignmentPageProps {
  params: Promise<{ assignmentId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Course Assignment | EduFlow LMS",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const { assignmentId } = await params;
  await requireServerUser(["STUDENT", "INSTRUCTOR", "ADMIN"]);

  return (
    <main className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6">
      <AssignmentView assignmentId={assignmentId} />
    </main>
  );
}
