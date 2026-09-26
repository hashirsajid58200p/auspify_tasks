"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, SlidersHorizontal, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from "./course-card";
import { CatalogCourseItem } from "@/server/services/catalog";

interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
}

interface CatalogViewProps {
  initialCategories: CategoryOption[];
}

interface CatalogResponse {
  data: CatalogCourseItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function CatalogView({ initialCategories }: CatalogViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [page, setPage] = useState<number>(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isError, refetch } = useQuery<CatalogResponse>({
    queryKey: ["courses", debouncedSearch, selectedCategory, selectedLevel, sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
      if (selectedCategory !== "all") params.set("categoryId", selectedCategory);
      if (selectedLevel !== "all") params.set("level", selectedLevel);
      params.set("sort", sortBy);
      params.set("page", page.toString());
      params.set("limit", "12");

      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load courses");
      return res.json();
    },
  });

  const courses = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 12, totalPages: 1 };

  const hasActiveFilters =
    debouncedSearch.length > 0 ||
    selectedCategory !== "all" ||
    selectedLevel !== "all" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSortBy("newest");
    setPage(1);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header & Search Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Explore Courses
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Browse high-impact courses designed to take you from fundamentals to production mastery.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses by topic, title..."
            className="pl-10 pr-9 h-11 text-sm rounded-xl bg-card border-border shadow-xs focus-visible:ring-primary"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Badge
            variant={selectedCategory === "all" ? "default" : "outline"}
            className="cursor-pointer text-xs font-medium py-1.5 px-3.5 rounded-full transition-all shrink-0"
            onClick={() => {
              setSelectedCategory("all");
              setPage(1);
            }}
          >
            All Categories
          </Badge>
          {initialCategories.map((cat) => (
            <Badge
              key={cat._id}
              variant={selectedCategory === cat._id ? "default" : "outline"}
              className="cursor-pointer text-xs font-medium py-1.5 px-3.5 rounded-full transition-all shrink-0"
              onClick={() => {
                setSelectedCategory(cat._id);
                setPage(1);
              }}
            >
              {cat.name}
            </Badge>
          ))}
        </div>

        {/* Level and Sort Selects */}
        <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
          <div className="w-36">
            <Select
              value={selectedLevel}
              onValueChange={(val) => {
                setSelectedLevel(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl bg-card border-border">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
                <SelectItem value="ALL_LEVELS">All Levels</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl bg-card border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Enrolled</SelectItem>
                <SelectItem value="title">Course Title (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground px-2"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Meta result count */}
      {!isLoading && !isError && (
        <div className="text-xs text-muted-foreground">
          Showing {courses.length} of {meta.total} {meta.total === 1 ? "course" : "courses"}
        </div>
      )}

      {/* Course Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden space-y-3 p-4">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="pt-4 border-t border-border flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-12 text-center space-y-4">
          <p className="text-sm text-destructive font-medium">
            Failed to load courses. Please check your network and try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/60" />
          <h2 className="text-lg font-semibold text-foreground">No courses found</h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            {hasActiveFilters
              ? "We couldn't find any courses matching your active search and filter criteria."
              : "No courses are currently published in the catalog. Check back soon!"}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="rounded-xl">
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="rounded-xl h-9 px-3"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="text-xs font-medium text-muted-foreground px-4">
            Page {meta.page} of {meta.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages || isLoading}
            className="rounded-xl h-9 px-3"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
