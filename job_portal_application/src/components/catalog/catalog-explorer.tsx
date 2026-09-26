"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpDown, Briefcase, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobCard } from "./job-card";
import { JobFilters, FilterState, CategoryOption } from "./job-filters";
import { MobileFilterDrawer } from "./mobile-filter-drawer";

interface CatalogExplorerProps {
  initialJobs: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  categories: CategoryOption[];
  initialFilters: FilterState;
}

export function CatalogExplorer({
  initialJobs,
  meta,
  categories,
  initialFilters,
}: CatalogExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(initialFilters.q || "");

  function applyFilters(newFilters: Partial<FilterState>) {
    const updated = {
      ...initialFilters,
      ...newFilters,
    };

    const params = new URLSearchParams();
    if (updated.q) params.set("q", updated.q);
    if (updated.categoryId) params.set("categoryId", updated.categoryId);
    if (updated.type) params.set("type", updated.type);
    if (updated.locationType) params.set("locationType", updated.locationType);
    if (updated.experienceLevel) params.set("experienceLevel", updated.experienceLevel);
    if (updated.salaryMin && updated.salaryMin > 0)
      params.set("salaryMin", updated.salaryMin.toString());
    if (updated.sort && updated.sort !== "newest") params.set("sort", updated.sort);
    if (updated.page && updated.page > 1) params.set("page", updated.page.toString());

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ q: searchTerm.trim(), page: 1 });
  }

  function handleReset() {
    setSearchTerm("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const sortLabels: Record<string, string> = {
    newest: "Newest First",
    salary: "Highest Salary",
    views: "Most Popular",
  };

  const currentSort = initialFilters.sort || "newest";

  return (
    <div className="space-y-6">
      {/* Search and Quick Bar */}
      <div className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-neo">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title, skill (e.g. React, Node), or location..."
              className="pl-12 h-12 rounded-xl text-sm md:text-base border-2 border-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={isPending}
              className="h-12 px-6 rounded-xl font-black flex items-center gap-2 shadow-neo-sm flex-1 sm:flex-none"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Button>

            {/* Mobile Filter Drawer trigger */}
            <MobileFilterDrawer
              categories={categories}
              filters={initialFilters}
              onChange={applyFilters}
              onReset={handleReset}
              totalCount={meta.total}
            />
          </div>
        </form>

        {/* Popular Category Chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-black/10 dark:border-white/10 text-xs">
            <span className="font-bold text-muted-foreground">Quick filter:</span>
            {categories.slice(0, 5).map((cat) => (
              <Badge
                key={cat._id}
                variant="outline"
                onClick={() => applyFilters({ categoryId: cat._id, page: 1 })}
                className={`cursor-pointer border-2 border-black font-bold transition-all ${
                  initialFilters.categoryId === cat._id
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Main Layout: Sidebar Filters + Listings */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block w-64 shrink-0 bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-5 shadow-neo sticky top-24">
          <JobFilters
            categories={categories}
            filters={initialFilters}
            onChange={applyFilters}
            onReset={handleReset}
          />
        </aside>

        {/* Listings Section */}
        <main className="flex-1 w-full space-y-4">
          {/* Header row: Count + Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#191919] border-2 border-black rounded-2xl px-4 py-3 shadow-neo-sm">
            <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              <span>Found </span>
              <span className="font-black text-[#2F81F7]">{meta.total}</span>
              <span> published {meta.total === 1 ? "opening" : "openings"}</span>
              {isPending && (
                <span className="ml-2 text-xs font-semibold text-muted-foreground animate-pulse">
                  (updating...)
                </span>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-2 border-black font-bold text-xs h-9 flex items-center gap-1.5"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Sort: {sortLabels[currentSort]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-2 border-black shadow-neo-sm font-bold"
              >
                <DropdownMenuItem onClick={() => applyFilters({ sort: "newest", page: 1 })}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyFilters({ sort: "salary", page: 1 })}>
                  Highest Salary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyFilters({ sort: "views", page: 1 })}>
                  Most Popular
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Job Listings List */}
          {initialJobs.length === 0 ? (
            <div className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-8 md:p-12 text-center shadow-neo space-y-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black">No published roles found</h3>
                <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto">
                  We couldn&apos;t find any published positions matching your current search and
                  filter criteria.
                </p>
              </div>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-2 border-black rounded-xl font-bold flex items-center gap-2 mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Filters</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {initialJobs.map((job) => (
                <JobCard key={job._id.toString()} job={job} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1 || isPending}
                onClick={() => applyFilters({ page: meta.page - 1 })}
                className="border-2 border-black rounded-xl font-bold px-4 h-10 shadow-neo-sm"
              >
                Previous
              </Button>
              <span className="text-xs font-black px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-black/20">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages || isPending}
                onClick={() => applyFilters({ page: meta.page + 1 })}
                className="border-2 border-black rounded-xl font-bold px-4 h-10 shadow-neo-sm"
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
