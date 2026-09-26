"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, PlayCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EnrolledCourseItem } from "@/server/services/enrollments";

interface EnrolledCourseCardProps {
  course: EnrolledCourseItem;
}

export function EnrolledCourseCard({ course }: EnrolledCourseCardProps) {
  const isCompleted = course.status === "COMPLETED";

  return (
    <Card className="flex flex-col overflow-hidden rounded-2xl border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/40">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/60">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-primary/10 text-primary">
            <BookOpen className="w-10 h-10" />
          </div>
        )}

        <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
          {course.category && (
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-[11px] font-medium border-border/50">
              {course.category.name}
            </Badge>
          )}
          <Badge
            variant={isCompleted ? "default" : "outline"}
            className={`text-[10px] font-semibold uppercase backdrop-blur-md ${
              isCompleted
                ? "bg-purple-500/90 text-white"
                : "bg-background/90 text-foreground"
            }`}
          >
            {isCompleted ? "Completed" : "In Progress"}
          </Badge>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-bold text-base text-foreground line-clamp-1 hover:text-primary transition-colors">
            <Link href={`/learn/${course.slug}`}>{course.title}</Link>
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {course.summary}
          </p>
        </div>

        {/* Progress Section */}
        <div className="space-y-3 pt-2 border-t border-border/60">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Progress</span>
              <span className="font-bold text-primary">{course.progressPct}%</span>
            </div>
            <Progress value={course.progressPct} className="h-2" />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
            </span>

            <Button size="sm" className="rounded-xl h-8 px-3 text-xs gap-1.5" asChild>
              <Link href={`/learn/${course.slug}`}>
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Review
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-3.5 h-3.5" />
                    Continue
                  </>
                )}
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
