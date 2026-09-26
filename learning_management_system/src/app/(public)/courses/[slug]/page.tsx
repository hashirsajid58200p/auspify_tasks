import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  Award,
  Globe,
  Share2,
} from "lucide-react";
import { getCourseBySlug } from "@/server/services/catalog";
import { getEnrollmentForCourse } from "@/server/services/enrollments";
import { verifyAccessToken } from "@/server/auth/tokens";
import { ACCESS_COOKIE_NAME } from "@/server/auth/cookies";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MarkdownView } from "@/components/ui/markdown-view";
import { CourseCurriculumAccordion } from "@/components/catalog/course-curriculum-accordion";
import { CourseDetailActions } from "@/components/catalog/course-detail-actions";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { course } = await getCourseBySlug(slug);
    return {
      title: `${course.title} | EduFlow LMS`,
      description: course.summary,
      openGraph: {
        title: `${course.title} | EduFlow LMS`,
        description: course.summary,
        images: course.thumbnailUrl ? [{ url: course.thumbnailUrl }] : [],
        type: "website",
      },
    };
  } catch {
    return {
      title: "Course Not Found | EduFlow LMS",
    };
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;

  let courseData;
  try {
    courseData = await getCourseBySlug(slug);
  } catch {
    notFound();
  }

  const { course, modules, totalDurationMin } = courseData;

  // Check user authentication and enrollment state
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  let currentUserId: string | null = null;
  let isEnrolled = false;
  let progressPct = 0;

  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      currentUserId = payload.sub;
      const enrollment = await getEnrollmentForCourse(payload.sub, course._id);
      if (enrollment) {
        isEnrolled = true;
        progressPct = enrollment.progressPct || 0;
      }
    } catch {
      // Token expired or invalid, treated as unauthenticated for public page
    }
  }

  const instructorInitials = course.instructor?.name
    ? course.instructor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "IN";

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    provider: {
      "@type": "Organization",
      name: "EduFlow LMS",
      sameAs: process.env.NEXT_PUBLIC_APP_URL || "https://eduflow.local",
    },
    educationalLevel: course.level,
    instructor: {
      "@type": "Person",
      name: course.instructor?.name || "EduFlow Instructor",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
        suppressHydrationWarning
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 animate-fade-in pb-16">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/courses" className="hover:text-foreground transition-colors">
            Courses
          </Link>
          {course.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href={`/courses?categoryId=${course.category._id}`}
                className="hover:text-foreground transition-colors"
              >
                {course.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="truncate max-w-[200px] text-foreground font-medium">
            {course.title}
          </span>
        </nav>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Course Info (Left 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {course.category && (
                <Badge variant="secondary" className="text-xs font-semibold px-3 py-1">
                  {course.category.name}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs font-semibold uppercase px-3 py-1">
                {course.level.replace("_", " ")}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              {course.title}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {course.summary}
            </p>

            {/* Instructor and Stats Row */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-muted-foreground border-y border-border/60 py-4">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                    {instructorInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-xs text-muted-foreground/80 block">Taught by</span>
                  <span className="font-semibold text-foreground">
                    {course.instructor?.name || "EduFlow Instructor"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>
                  {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
                </span>
              </div>

              {totalDurationMin > 0 && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{totalDurationMin} min total</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span>{course.enrollmentCount} students enrolled</span>
              </div>
            </div>

            {/* Course Syllabus Overview */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Course Syllabus
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {modules.length} {modules.length === 1 ? "module" : "modules"} • {course.lessonCount} lessons
              </p>
              <CourseCurriculumAccordion modules={modules} courseTitle={course.title} />
            </div>

            {/* Course Description / Detailed Notes */}
            {course.description && (
              <div className="space-y-4 pt-6 border-t border-border">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  About this Course
                </h2>
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                  <MarkdownView content={course.description} />
                </div>
              </div>
            )}

            {/* Instructor Bio Card */}
            {course.instructor && (
              <div className="space-y-4 pt-6 border-t border-border">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Instructor
                </h2>
                <Card className="rounded-2xl border-border bg-card p-6 flex flex-col sm:flex-row gap-5 items-start">
                  <Avatar className="h-16 w-16 border-2 border-primary/20 shrink-0">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                      {instructorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {course.instructor.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {course.instructor.bio ||
                        "Experienced software educator and engineering practitioner passionate about sharing real-world software development techniques."}
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Sticky Enrollment & Action Sidebar (Right 4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <Card className="rounded-2xl border-border bg-card overflow-hidden shadow-lg p-6 space-y-6">
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted/60">
                {course.thumbnailUrl ? (
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-primary/10 text-primary">
                    <BookOpen className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Price Tag & CTA */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground">Free</span>
                  <span className="text-xs text-muted-foreground">Full lifetime access</span>
                </div>
                <CourseDetailActions
                  courseId={course._id}
                  courseSlug={course.slug}
                  isLoggedIn={!!currentUserId}
                  isEnrolled={isEnrolled}
                  progressPct={progressPct}
                />
              </div>

              {/* Course Features List */}
              <div className="space-y-3 pt-4 border-t border-border text-xs text-muted-foreground">
                <div className="font-semibold text-foreground text-xs uppercase tracking-wider mb-2">
                  This course includes:
                </div>
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>{course.lessonCount} comprehensive lessons</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-primary" />
                  <span>100% online and self-paced</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-primary" />
                  <span>Certificate of completion upon 100% progress</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Interactive quizzes and hands-on assignments</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
