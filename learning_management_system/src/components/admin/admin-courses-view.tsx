"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  CheckCircle,
  Archive,
  FileEdit,
  Loader2,
  ExternalLink,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminCourseItem {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  level: string;
  enrollmentCount: number;
  instructor: {
    id: string;
    name: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
  };
  createdAt: string | Date;
}

interface AdminCoursesViewProps {
  initialCourses: AdminCourseItem[];
}

export function AdminCoursesView({ initialCourses }: AdminCoursesViewProps) {
  const [courses, setCourses] = React.useState<AdminCourseItem[]>(initialCourses);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [isLoading, setIsLoading] = React.useState(false);
  const [moderatingId, setModeratingId] = React.useState<string | null>(null);

  const fetchCourses = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/courses?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to fetch courses");

      setCourses(json.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error fetching courses");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  const handleModerate = async (courseId: string, newStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    setModeratingId(courseId);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to moderate course");

      toast.success(`Course status updated to ${newStatus}`);
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: newStatus } : c))
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Moderation failed");
    } finally {
      setModeratingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Course Moderation Panel
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Review instructor submissions, enforce course quality standards, and regulate publishing.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCourses()}
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
            <SelectTrigger className="w-[150px] h-10 text-xs rounded-xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={fetchCourses}
            className="rounded-xl h-10 px-4 text-xs shrink-0"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Filter"}
          </Button>
        </div>
      </div>

      {/* Courses Moderation Table */}
      <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
        {courses.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">No courses found</p>
            <p>Try modifying your search or filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Enrollments</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {courses.map((c) => {
                  const isBusy = moderatingId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-foreground">{c.title}</p>
                        <p className="text-2xs text-muted-foreground">/{c.slug}</p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{c.instructor.name}</p>
                        <p className="text-2xs text-muted-foreground">{c.instructor.email}</p>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {c.category?.name || "Uncategorized"}
                      </td>

                      <td className="py-3 px-4">
                        {c.status === "PUBLISHED" ? (
                          <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20 text-2xs">
                            Published
                          </Badge>
                        ) : c.status === "ARCHIVED" ? (
                          <Badge variant="outline" className="text-2xs text-muted-foreground">
                            Archived
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-2xs">
                            Draft
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 font-bold text-foreground">
                        {c.enrollmentCount || 0}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-2xs h-8 px-2"
                            asChild
                          >
                            <Link href={`/courses/${c.slug}`} target="_blank">
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Preview
                            </Link>
                          </Button>

                          {c.status !== "PUBLISHED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-2xs h-8 text-emerald-600 hover:bg-emerald-600/10"
                              disabled={isBusy}
                              onClick={() => handleModerate(c.id, "PUBLISHED")}
                            >
                              Publish
                            </Button>
                          )}

                          {c.status !== "ARCHIVED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-2xs h-8 text-amber-600 hover:bg-amber-600/10"
                              disabled={isBusy}
                              onClick={() => handleModerate(c.id, "ARCHIVED")}
                            >
                              Archive
                            </Button>
                          )}

                          {c.status !== "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-2xs h-8 text-muted-foreground hover:bg-muted"
                              disabled={isBusy}
                              onClick={() => handleModerate(c.id, "DRAFT")}
                            >
                              Unpublish
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
