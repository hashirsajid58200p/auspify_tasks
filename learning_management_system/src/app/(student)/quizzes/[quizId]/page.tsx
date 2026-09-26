import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { QuizTakingView } from "@/components/student/quiz-taking-view";

interface QuizPageProps {
  params: Promise<{ quizId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Quiz Assessment | EduFlow LMS",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { quizId } = await params;
  await requireServerUser(["STUDENT", "INSTRUCTOR", "ADMIN"]);

  return (
    <main className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6">
      <QuizTakingView quizId={quizId} />
    </main>
  );
}
