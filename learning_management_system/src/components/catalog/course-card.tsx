"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, Users, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CatalogCourseItem } from "@/server/services/catalog";

interface CourseCardProps {
  course: CatalogCourseItem;
}

export function CourseCard({ course }: CourseCardProps) {
  const initials = course.instructor?.name
    ? course.instructor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "IN";

  const levelColorMap: Record<string, string> = {
    BEGINNER: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    INTERMEDIATE: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    ADVANCED: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    ALL_LEVELS: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };

  return (
    <Link href={`/courses/${course.slug}`} className="group block focus:outline-none">
      <Card className="h-full flex flex-col overflow-hidden rounded-2xl border-border bg-card transition-all duration-300 hover:shadow-lg hover:border-primary/40 hover:-translate-y-1">
        {/* Course Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted/60">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-muted text-primary/40">
              <BookOpen className="w-12 h-12" />
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
            {course.category && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-[11px] font-medium border-border/50 shadow-sm">
                {course.category.name}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md ${
                levelColorMap[course.level] || "bg-background/90"
              }`}
            >
              {course.level.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Course Content */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-base md:text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {course.summary}
            </p>
          </div>

          <div className="pt-2 border-t border-border/60 space-y-3">
            {/* Instructor row */}
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-border">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground/80 truncate">
                {course.instructor?.name || "Instructor"}
              </span>
            </div>

            {/* Metrics and Link */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {course.enrollmentCount} {course.enrollmentCount === 1 ? "student" : "students"}
                </span>
              </div>
              <span className="flex items-center gap-1 text-primary font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                View
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
