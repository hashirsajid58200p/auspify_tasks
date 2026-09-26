"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnrolledCourseCard } from "./enrolled-course-card";
import { EnrolledCourseItem } from "@/server/services/enrollments";

interface MyCoursesViewProps {
  initialCourses: EnrolledCourseItem[];
}

export function MyCoursesView({ initialCourses }: MyCoursesViewProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredCourses = initialCourses.filter((course) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "in_progress" && course.status === "ACTIVE") ||
      (activeTab === "completed" && course.status === "COMPLETED");

    const matchesSearch =
      !searchTerm.trim() ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.summary.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            My Courses
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Courses you have enrolled in and your completion progress.
          </p>
        </div>
        <Button size="sm" className="rounded-xl self-start sm:self-auto" asChild>
          <Link href="/courses">Browse Catalog</Link>
        </Button>
      </div>

      {initialCourses.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg text-xs">
                All ({initialCourses.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="rounded-lg text-xs">
                In Progress ({initialCourses.filter((c) => c.status === "ACTIVE").length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg text-xs">
                Completed ({initialCourses.filter((c) => c.status === "COMPLETED").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your courses..."
              className="pl-9 pr-8 h-9 text-xs rounded-xl bg-card border-border"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid of Courses */}
      {initialCourses.length === 0 ? (
        <Card className="rounded-2xl border-border bg-card p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-base font-semibold text-foreground">No enrolled courses yet</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Start your learning journey by finding a course that matches your interests and enrolling.
          </p>
          <Button size="sm" className="mt-4 rounded-xl" asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card className="rounded-2xl border-border bg-card p-12 text-center">
          <h2 className="text-sm font-semibold text-foreground">No matching courses found</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search or tab filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab("all");
              setSearchTerm("");
            }}
            className="mt-3 rounded-xl text-xs"
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <EnrolledCourseCard key={course.enrollmentId} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
