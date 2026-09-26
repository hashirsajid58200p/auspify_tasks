"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { JobFilters, FilterState, CategoryOption } from "./job-filters";

interface MobileFilterDrawerProps {
  categories: CategoryOption[];
  filters: FilterState;
  onChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  totalCount?: number;
}

export function MobileFilterDrawer({
  categories,
  filters,
  onChange,
  onReset,
  totalCount,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);

  const activeFiltersCount = [
    filters.categoryId,
    filters.type,
    filters.locationType,
    filters.experienceLevel,
    filters.salaryMin && filters.salaryMin > 0 ? true : undefined,
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="md:hidden flex items-center gap-2 border-2 border-black rounded-xl font-bold h-11 px-4 shadow-neo-sm"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#2F81F7] text-white text-[11px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85vw] sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-black">Filter Jobs</SheetTitle>
        </SheetHeader>
        <JobFilters
          categories={categories}
          filters={filters}
          onChange={(newFilters) => {
            onChange(newFilters);
          }}
          onReset={() => {
            onReset();
          }}
        />
        <div className="pt-6 mt-6 border-t border-black/10 dark:border-white/10 sticky bottom-0 bg-background pb-2">
          <Button
            type="button"
            className="w-full rounded-xl font-black py-5 shadow-neo-sm"
            onClick={() => setOpen(false)}
          >
            Show Results {totalCount !== undefined ? `(${totalCount})` : ""}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
