"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Users,
  Search,
  ExternalLink,
  Clock,
  Layers,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateCourseDialog } from "@/components/instructor/create-course-dialog";
import { fetchApi } from "@/lib/api-client";
import { InstructorCourseListItem } from "@/server/services/courses";

export function CourseManagement() {
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const { data: courses = [], isLoading, isError, refetch } = useQuery<InstructorCourseListItem[]>({
    queryKey: ["instructor-courses", selectedStatus],
    queryFn: async () => {
      const statusParam = selectedStatus !== "ALL" ? `?status=${selectedStatus}` : "";
      const res = await fetchApi<InstructorCourseListItem[]>(
        `/api/instructor/courses${statusParam}`
      );
      return res || [];
    },
  });

  // Calculate quick metrics across fetched courses
  const metrics = React.useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.status === "PUBLISHED").length;
    const draft = courses.filter((c) => c.status === "DRAFT").length;
    const totalStudents = courses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0);
    return { total, published, draft, totalStudents };
  }, [courses]);

  // Client-side search filtering
  const filteredCourses = React.useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase().trim();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.categoryName?.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
            Published
          </Badge>
        );
      case "ARCHIVED":
        return (
          <Badge className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 text-[10px] font-semibold">
            Archived
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold">
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Instructor Portal
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Build and manage your curriculum, monitor enrollments, and publish interactive courses.
          </p>
        </div>
        <CreateCourseDialog />
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider opacity-90">
              Total Courses
            </span>
            <BookOpen className="w-4 h-4 opacity-80" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold">{metrics.total}</div>
          <p className="mt-1 text-[10px] sm:text-xs opacity-80">Catalog total</p>
        </Card>

        <Card className="p-4 sm:p-5 rounded-2xl bg-card border-border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">
              Published
            </span>
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-foreground">
            {metrics.published}
          </div>
          <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">Live & enrolling</p>
        </Card>

        <Card className="p-4 sm:p-5 rounded-2xl bg-card border-border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">
              Students
            </span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-foreground">
            {metrics.totalStudents}
          </div>
          <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">Total enrollments</p>
        </Card>

        <Card className="p-4 sm:p-5 rounded-2xl bg-card border-border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">
              Drafts
            </span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-foreground">{metrics.draft}</div>
          <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">In progress</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <Tabs
          value={selectedStatus}
          onValueChange={setSelectedStatus}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-9 rounded-xl p-1 bg-muted/80">
            <TabsTrigger value="ALL" className="text-xs rounded-lg px-3">
              All
            </TabsTrigger>
            <TabsTrigger value="PUBLISHED" className="text-xs rounded-lg px-3">
              Published
            </TabsTrigger>
            <TabsTrigger value="DRAFT" className="text-xs rounded-lg px-3">
              Drafts
            </TabsTrigger>
            <TabsTrigger value="ARCHIVED" className="text-xs rounded-lg px-3">
              Archived
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs rounded-xl bg-card border-border"
          />
        </div>
      </div>

      {/* Courses Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl p-4 space-y-3 border-border">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-4 w-1/3 rounded-lg" />
              <Skeleton className="h-5 w-4/5 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="rounded-2xl p-8 text-center border-destructive/20 bg-destructive/5">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">Failed to load courses</p>
          <p className="text-xs text-muted-foreground mt-1">Please try again in a few moments.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-4 rounded-xl text-xs">
            Retry
          </Button>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card className="rounded-2xl border-border bg-card p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            {searchQuery ? "No matching courses found" : "No courses built yet"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search criteria or switching the filter tab."
              : "Start by creating your first course. Add modules, lessons with video embeds or markdown text, quizzes, and assignments."}
          </p>
          <div className="mt-4">
            <CreateCourseDialog triggerText="Create Your First Course" />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="flex flex-col rounded-2xl border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all group"
            >
              {/* Thumbnail or Fallback Header */}
              <div className="relative h-40 w-full bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-secondary flex items-center justify-center overflow-hidden">
                {course.thumbnailUrl ? (
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <BookOpen className="w-10 h-10 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
                )}
                <div className="absolute top-2.5 right-2.5">
                  {getStatusBadge(course.status)}
                </div>
                <div className="absolute bottom-2.5 left-2.5">
                  <Badge variant="secondary" className="text-[10px] backdrop-blur-md bg-background/80">
                    {course.categoryName}
                  </Badge>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="capitalize">{course.level.toLowerCase().replace("_", " ")}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {new Date(course.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {course.summary}
                  </p>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium text-foreground">{course.lessonCount}</span> lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-foreground">{course.enrollmentCount}</span> students
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-xl text-xs gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                    asChild
                  >
                    <Link href={`/instructor/courses/${course.id}`}>
                      Edit
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
