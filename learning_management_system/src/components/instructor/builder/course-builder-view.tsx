"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Globe,
  Trash2,
  Layers,
  Settings2,
  Loader2,
  AlertCircle,
  ExternalLink,
  ListChecks,
  FileText,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CourseDetailsTab } from "@/components/instructor/builder/course-details-tab";
import { CurriculumTab } from "@/components/instructor/builder/curriculum-tab";
import { QuizzesTab } from "@/components/instructor/builder/quizzes-tab";
import { AssignmentsTab } from "@/components/instructor/builder/assignments-tab";
import { SubmissionsTab } from "@/components/instructor/builder/submissions-tab";
import { PublishModal } from "@/components/instructor/builder/publish-modal";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { CourseWithCurriculum } from "@/server/services/courses";

interface CourseBuilderViewProps {
  courseId: string;
}

export function CourseBuilderView({ courseId }: CourseBuilderViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [publishModalOpen, setPublishModalOpen] = React.useState(false);

  const { data: course, isLoading, isError, error } = useQuery<CourseWithCurriculum>({
    queryKey: ["course-builder", courseId],
    queryFn: async () => {
      const res = await fetchApi<CourseWithCurriculum>(
        `/api/instructor/courses/${courseId}`
      );
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await fetchApi(`/api/instructor/courses/${courseId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("Course deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      router.push("/instructor/courses");
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete course.");
      }
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <Card className="max-w-xl mx-auto p-10 text-center rounded-2xl border-destructive/20 bg-destructive/5 space-y-3 mt-10">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Course Not Found</h2>
        <p className="text-xs text-muted-foreground">
          This course may have been removed or you may not have permission to view it.
        </p>
        <Button size="sm" variant="outline" className="rounded-xl text-xs mt-2" asChild>
          <Link href="/instructor/courses">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to My Courses
          </Link>
        </Button>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold">
            ● Published
          </Badge>
        );
      case "ARCHIVED":
        return (
          <Badge className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 text-xs font-semibold">
            Archived
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-semibold">
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/instructor/courses"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
          Back to Courses
        </Link>

        {course.status === "PUBLISHED" && (
          <Link
            href={`/courses/${course.slug}`}
            target="_blank"
            className="inline-flex items-center text-xs font-medium text-primary hover:underline gap-1"
          >
            View Public Course Page
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Course Builder Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-sm">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge(course.status)}
            {course.category && (
              <Badge variant="secondary" className="text-xs">
                {course.category.name}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs capitalize">
              {course.level.toLowerCase().replace("_", " ")}
            </Badge>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {course.title}
          </h1>

          <p className="text-xs text-muted-foreground max-w-2xl line-clamp-2">
            {course.summary}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs gap-1.5 h-9"
            onClick={() => setPublishModalOpen(true)}
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            {course.status === "PUBLISHED" ? "Manage Publication" : "Publish Course"}
          </Button>

          {/* Delete Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl text-xs h-9 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-bold">Delete Course</AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground">
                  Are you sure you want to permanently delete this course? Courses with active student enrollments cannot be deleted and must be archived instead.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : null}
                  Delete Course
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Builder Main Tabs */}
      <Tabs defaultValue="curriculum" className="w-full space-y-6">
        <TabsList className="h-auto p-1 bg-muted/80 w-full sm:w-auto flex flex-wrap items-center gap-1 rounded-xl">
          <TabsTrigger value="curriculum" className="text-xs font-semibold rounded-lg flex items-center gap-1.5 px-3 py-2">
            <Layers className="w-3.5 h-3.5" />
            Curriculum
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs font-semibold rounded-lg flex items-center gap-1.5 px-3 py-2">
            <Settings2 className="w-3.5 h-3.5" />
            Course Details
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="text-xs font-semibold rounded-lg flex items-center gap-1.5 px-3 py-2">
            <ListChecks className="w-3.5 h-3.5" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs font-semibold rounded-lg flex items-center gap-1.5 px-3 py-2">
            <FileText className="w-3.5 h-3.5" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="submissions" className="text-xs font-semibold rounded-lg flex items-center gap-1.5 px-3 py-2">
            <Inbox className="w-3.5 h-3.5" />
            Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="outline-none">
          <CurriculumTab courseId={course.id} modules={course.modules || []} />
        </TabsContent>

        <TabsContent value="details" className="outline-none">
          <CourseDetailsTab course={course} />
        </TabsContent>

        <TabsContent value="quizzes" className="outline-none">
          <QuizzesTab courseId={course.id} modules={course.modules || []} />
        </TabsContent>

        <TabsContent value="assignments" className="outline-none">
          <AssignmentsTab courseId={course.id} modules={course.modules || []} />
        </TabsContent>

        <TabsContent value="submissions" className="outline-none">
          <SubmissionsTab courseId={course.id} />
        </TabsContent>
      </Tabs>

      {/* Publish Modal */}
      <PublishModal
        courseId={course.id}
        currentStatus={course.status}
        open={publishModalOpen}
        onOpenChange={setPublishModalOpen}
      />
    </div>
  );
}
