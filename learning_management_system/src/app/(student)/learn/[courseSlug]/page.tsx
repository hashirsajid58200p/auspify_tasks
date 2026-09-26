import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireServerUser } from "@/server/auth/server-session";
import { getCourseCurriculumForLearning } from "@/server/services/learning";
import { LearningPlayerView } from "@/components/player/learning-player-view";

interface LearnPageProps {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({
  params,
}: LearnPageProps): Promise<Metadata> {
  const { courseSlug } = await params;
  return {
    title: `Learning | EduFlow LMS`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function LearnPage({ params }: LearnPageProps) {
  const { courseSlug } = await params;
  const user = await requireServerUser(["STUDENT", "INSTRUCTOR", "ADMIN"]);

  let data;
  try {
    data = await getCourseCurriculumForLearning(
      {
        userId: user.userId,
        name: user.name,
        role: user.role,
        status: user.status,
        email: user.email,
        isDemo: user.isDemo,
      },
      courseSlug
    );
  } catch (err) {
    // If not enrolled or course doesn't exist, redirect to public course page
    redirect(`/courses/${courseSlug}`);
  }

  return (
    <LearningPlayerView
      course={data.course}
      modules={data.modules}
      courseQuizzes={data.courseQuizzes}
      courseAssignments={data.courseAssignments}
      initialProgressPct={data.progressPct}
      initialLessonId={data.lastLessonId}
    />
  );
}
