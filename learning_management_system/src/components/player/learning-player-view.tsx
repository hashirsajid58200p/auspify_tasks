"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Video,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  Loader2,
  Check,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MarkdownView } from "@/components/ui/markdown-view";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { toast } from "sonner";

interface LearningLesson {
  _id: string;
  moduleId: string;
  title: string;
  order: number;
  type: "VIDEO" | "TEXT";
  durationMin: number;
  isPreview: boolean;
  isCompleted: boolean;
}

export interface LearningQuiz {
  _id: string;
  moduleId: string | null;
  title: string;
  timeLimitMin: number | null;
  passingPct: number;
  isRequired: boolean;
  questionCount: number;
  hasPassed: boolean;
}

export interface LearningAssignment {
  _id: string;
  moduleId: string | null;
  title: string;
  maxPoints: number;
  dueAt: string | null;
  isRequired: boolean;
  isSubmitted: boolean;
  isGraded: boolean;
}

interface LearningModule {
  _id: string;
  title: string;
  order: number;
  lessons: LearningLesson[];
  quizzes?: LearningQuiz[];
  assignments?: LearningAssignment[];
}

interface LessonDetailResponse {
  lesson: {
    _id: string;
    courseId: string;
    moduleId: string;
    title: string;
    order: number;
    type: "VIDEO" | "TEXT";
    videoUrl: string | null;
    content: string;
    durationMin: number;
  };
  isCompleted: boolean;
  previousLesson: { _id: string; title: string } | null;
  nextLesson: { _id: string; title: string } | null;
}

interface LearningPlayerViewProps {
  course: {
    _id: string;
    title: string;
    slug: string;
    summary: string;
  };
  modules: LearningModule[];
  courseQuizzes?: LearningQuiz[];
  courseAssignments?: LearningAssignment[];
  initialProgressPct: number;
  initialLessonId: string | null;
}

interface CurriculumListProps {
  modules: LearningModule[];
  courseQuizzes?: LearningQuiz[];
  courseAssignments?: LearningAssignment[];
  completedLessonIds: Set<string>;
  allLessonsCount: number;
  progressPct: number;
  currentLessonId: string;
  activeModuleId?: string;
  onSelectLesson: (id: string) => void;
}

function CurriculumList({
  modules,
  courseQuizzes,
  courseAssignments,
  completedLessonIds,
  allLessonsCount,
  progressPct,
  currentLessonId,
  activeModuleId,
  onSelectLesson,
}: CurriculumListProps) {
  const hasCourseAssessments =
    (courseQuizzes && courseQuizzes.length > 0) ||
    (courseAssignments && courseAssignments.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border text-xs text-muted-foreground">
        <span>
          {completedLessonIds.size} of {allLessonsCount} completed
        </span>
        <span className="font-semibold text-primary">{progressPct}%</span>
      </div>

      <Accordion
        type="multiple"
        defaultValue={activeModuleId ? [activeModuleId] : undefined}
        className="space-y-2.5"
      >
        {modules.map((mod, modIdx) => (
          <AccordionItem
            key={mod._id}
            value={mod._id}
            className="border border-border rounded-xl bg-card overflow-hidden px-3"
          >
            <AccordionTrigger className="hover:no-underline py-3 text-xs sm:text-sm font-semibold text-foreground text-left">
              <span className="truncate pr-2">
                {modIdx + 1}. {mod.title}
              </span>
            </AccordionTrigger>

            <AccordionContent className="pb-3 pt-1 space-y-1">
              {mod.lessons.map((lesson) => {
                const isActive = lesson._id === currentLessonId;
                const isDone = completedLessonIds.has(lesson._id);

                return (
                  <button
                    key={lesson._id}
                    onClick={() => onSelectLesson(lesson._id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                        : "hover:bg-muted/50 text-foreground/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
                      {lesson.type === "VIDEO" ? (
                        <Video className="w-3 h-3 text-primary" />
                      ) : (
                        <FileText className="w-3 h-3" />
                      )}
                      <span>{lesson.durationMin}m</span>
                    </div>
                  </button>
                );
              })}

              {/* Module Quizzes */}
              {mod.quizzes?.map((quiz) => (
                <Link
                  key={quiz._id}
                  href={`/quizzes/${quiz._id}`}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors hover:bg-muted/50 text-foreground/80 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {quiz.hasPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                    )}
                    <span className="truncate group-hover:text-primary transition-colors">
                      {quiz.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
                    <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                      Quiz ({quiz.passingPct}%)
                    </Badge>
                  </div>
                </Link>
              ))}

              {/* Module Assignments */}
              {mod.assignments?.map((asgn) => (
                <Link
                  key={asgn._id}
                  href={`/assignments/${asgn._id}`}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors hover:bg-muted/50 text-foreground/80 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {asgn.isSubmitted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate group-hover:text-primary transition-colors">
                      {asgn.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
                    <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                      {asgn.maxPoints} pts
                    </Badge>
                  </div>
                </Link>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}

        {/* Course-Level Assessments Item */}
        {hasCourseAssessments && (
          <AccordionItem
            value="course-assessments"
            className="border border-border rounded-xl bg-card overflow-hidden px-3"
          >
            <AccordionTrigger className="hover:no-underline py-3 text-xs sm:text-sm font-semibold text-foreground text-left">
              <span className="truncate pr-2">Course Assessments</span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-1 space-y-1">
              {courseQuizzes?.map((quiz) => (
                <Link
                  key={quiz._id}
                  href={`/quizzes/${quiz._id}`}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors hover:bg-muted/50 text-foreground/80 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {quiz.hasPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                    )}
                    <span className="truncate group-hover:text-primary transition-colors">
                      {quiz.title}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                    Quiz ({quiz.passingPct}%)
                  </Badge>
                </Link>
              ))}

              {courseAssignments?.map((asgn) => (
                <Link
                  key={asgn._id}
                  href={`/assignments/${asgn._id}`}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors hover:bg-muted/50 text-foreground/80 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {asgn.isSubmitted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate group-hover:text-primary transition-colors">
                      {asgn.title}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                    {asgn.maxPoints} pts
                  </Badge>
                </Link>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

export function LearningPlayerView({
  course,
  modules,
  courseQuizzes,
  courseAssignments,
  initialProgressPct,
  initialLessonId,
}: LearningPlayerViewProps) {
  const allLessons = useMemo(() => {
    return modules.flatMap((m) => m.lessons);
  }, [modules]);

  const defaultLessonId =
    initialLessonId || (allLessons.length > 0 ? allLessons[0]._id : "");

  const [currentLessonId, setCurrentLessonId] = useState<string>(defaultLessonId);
  const [progressPct, setProgressPct] = useState<number>(initialProgressPct);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const m of modules) {
      for (const l of m.lessons) {
        if (l.isCompleted) set.add(l._id);
      }
    }
    return set;
  });

  const [completing, setCompleting] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Fetch current lesson content via TanStack Query
  const { data: lessonDetail, isLoading: loadingLesson } = useQuery<LessonDetailResponse>({
    queryKey: ["lesson", currentLessonId],
    queryFn: async () => {
      if (!currentLessonId) throw new Error("No lesson selected");
      const res = await fetch(`/api/lessons/${currentLessonId}`);
      if (!res.ok) throw new Error("Failed to load lesson content");
      const json = await res.json();
      return json.data;
    },
    enabled: !!currentLessonId,
  });

  const isCurrentCompleted = completedLessonIds.has(currentLessonId);

  // Toggle lesson completion
  const handleToggleComplete = async () => {
    if (!currentLessonId || completing) return;
    setCompleting(true);

    try {
      if (isCurrentCompleted) {
        const res = await fetch(`/api/lessons/${currentLessonId}/complete`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to update lesson status");
        const json = await res.json();

        setCompletedLessonIds((prev) => {
          const next = new Set(prev);
          next.delete(currentLessonId);
          return next;
        });
        setProgressPct(json.data.progressPct);
        toast.info("Marked as incomplete");
      } else {
        const res = await fetch(`/api/lessons/${currentLessonId}/complete`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to complete lesson");
        const json = await res.json();

        setCompletedLessonIds((prev) => {
          const next = new Set(prev);
          next.add(currentLessonId);
          return next;
        });
        setProgressPct(json.data.progressPct);

        if (json.data.isCompleted) {
          toast.success("🎉 Course Completed! Congratulations!", {
            duration: 5000,
          });
        } else {
          toast.success("Lesson completed!");
        }

        if (lessonDetail?.nextLesson) {
          setTimeout(() => {
            setCurrentLessonId(lessonDetail.nextLesson!._id);
          }, 600);
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setCompleting(false);
    }
  };

  const activeModuleId = useMemo(() => {
    for (const m of modules) {
      if (m.lessons.some((l) => l._id === currentLessonId)) {
        return m._id;
      }
    }
    return modules.length > 0 ? modules[0]._id : undefined;
  }, [modules, currentLessonId]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Immersive Top Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Link href="/my-courses">
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">My Courses</span>
            </Link>
          </Button>

          <span className="text-muted-foreground/40 hidden sm:inline">|</span>

          <h1 className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-md">
            {course.title}
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-3 w-48 lg:w-64">
          <Progress value={progressPct} className="h-2 flex-1" />
          <span className="text-xs font-semibold text-primary shrink-0">
            {progressPct}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-8 px-2.5 text-xs rounded-xl"
              >
                <Menu className="w-4 h-4 mr-1.5" />
                Syllabus
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[380px] p-6 overflow-y-auto">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-base font-bold">Course Syllabus</SheetTitle>
              </SheetHeader>
              <CurriculumList
                modules={modules}
                courseQuizzes={courseQuizzes}
                courseAssignments={courseAssignments}
                completedLessonIds={completedLessonIds}
                allLessonsCount={allLessons.length}
                progressPct={progressPct}
                currentLessonId={currentLessonId}
                activeModuleId={activeModuleId}
                onSelectLesson={(id) => {
                  setCurrentLessonId(id);
                  setMobileDrawerOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Split Player Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lesson View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {loadingLesson ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-3 bg-card rounded-2xl border border-border">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading lesson content...</p>
              </div>
            ) : lessonDetail ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase font-bold tracking-wider"
                      >
                        {lessonDetail.lesson.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {lessonDetail.lesson.durationMin} min duration
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                      {lessonDetail.lesson.title}
                    </h2>
                  </div>

                  <Button
                    onClick={handleToggleComplete}
                    disabled={completing}
                    variant={isCurrentCompleted ? "outline" : "default"}
                    className={`rounded-xl h-10 px-4 text-xs font-semibold shrink-0 transition-all ${
                      isCurrentCompleted
                        ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                  >
                    {completing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : isCurrentCompleted ? (
                      <Check className="w-4 h-4 mr-1.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    )}
                    {isCurrentCompleted ? "Completed" : "Mark as Complete"}
                  </Button>
                </div>

                {lessonDetail.lesson.type === "VIDEO" && lessonDetail.lesson.videoUrl && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
                    <iframe
                      src={lessonDetail.lesson.videoUrl}
                      title={lessonDetail.lesson.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {lessonDetail.lesson.content && (
                  <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
                    <MarkdownView content={lessonDetail.lesson.content} />
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-border gap-4">
                  {lessonDetail.previousLesson ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentLessonId(lessonDetail.previousLesson!._id)}
                      className="rounded-xl h-10 px-3 text-xs"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      <span className="truncate max-w-[120px] sm:max-w-xs">
                        {lessonDetail.previousLesson.title}
                      </span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  {lessonDetail.nextLesson ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setCurrentLessonId(lessonDetail.nextLesson!._id)}
                      className="rounded-xl h-10 px-4 text-xs font-semibold shadow-sm bg-primary text-primary-foreground"
                    >
                      <span className="truncate max-w-[120px] sm:max-w-xs">
                        {lessonDetail.nextLesson.title}
                      </span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      asChild
                      className="rounded-xl h-10 px-4 text-xs font-semibold"
                    >
                      <Link href="/my-courses">
                        Finish Course
                        <Sparkles className="w-4 h-4 ml-1.5 text-primary" />
                      </Link>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-muted-foreground text-sm">
                Select a lesson from the syllabus to begin learning.
              </div>
            )}
          </div>
        </main>

        {/* Desktop Fixed Syllabus Sidebar */}
        <aside className="hidden lg:block w-80 xl:w-96 border-l border-border bg-card/60 p-6 overflow-y-auto">
          <div className="sticky top-0 pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
              Course Syllabus
            </h3>
            <p className="text-xs text-muted-foreground">
              {modules.length} modules • {allLessons.length} lessons
            </p>
          </div>
          <CurriculumList
            modules={modules}
            courseQuizzes={courseQuizzes}
            courseAssignments={courseAssignments}
            completedLessonIds={completedLessonIds}
            allLessonsCount={allLessons.length}
            progressPct={progressPct}
            currentLessonId={currentLessonId}
            activeModuleId={activeModuleId}
            onSelectLesson={(id) => setCurrentLessonId(id)}
          />
        </aside>
      </div>
    </div>
  );
}
