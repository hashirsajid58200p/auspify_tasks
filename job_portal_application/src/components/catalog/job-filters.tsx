"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FilterState {
  q?: string;
  categoryId?: string;
  type?: string;
  locationType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  sort?: string;
  page?: number;
}

export interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
  jobCount?: number;
}

interface JobFiltersProps {
  categories: CategoryOption[];
  filters: FilterState;
  onChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
}

const JOB_TYPES = [
  { label: "All Types", value: "" },
  { label: "Full-Time", value: "FULL_TIME" },
  { label: "Part-Time", value: "PART_TIME" },
  { label: "Contract", value: "CONTRACT" },
  { label: "Internship", value: "INTERNSHIP" },
];

const LOCATION_TYPES = [
  { label: "All Workplaces", value: "" },
  { label: "Remote", value: "REMOTE" },
  { label: "Hybrid", value: "HYBRID" },
  { label: "Onsite", value: "ONSITE" },
];

const EXPERIENCE_LEVELS = [
  { label: "All Experience Levels", value: "" },
  { label: "Entry Level", value: "ENTRY" },
  { label: "Mid Level", value: "MID" },
  { label: "Senior", value: "SENIOR" },
  { label: "Lead / Staff", value: "LEAD" },
  { label: "Executive", value: "EXECUTIVE" },
];

const SALARY_THRESHOLDS = [
  { label: "Any Salary", value: 0 },
  { label: "$50,000+", value: 50000 },
  { label: "$80,000+", value: 80000 },
  { label: "$100,000+", value: 100000 },
  { label: "$120,000+", value: 120000 },
  { label: "$150,000+", value: 150000 },
];

export function JobFilters({ categories, filters, onChange, onReset }: JobFiltersProps) {
  const hasActiveFilters = Boolean(
    filters.categoryId ||
    filters.type ||
    filters.locationType ||
    filters.experienceLevel ||
    (filters.salaryMin && filters.salaryMin > 0),
  );

  return (
    <div className="space-y-6">
      {/* Reset button if active */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base tracking-tight">Filter Listings</h3>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs font-bold text-muted-foreground hover:text-red-500 h-8 px-2 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Category
        </label>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onChange({ categoryId: "", page: 1 })}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
              !filters.categoryId
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            }`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => onChange({ categoryId: cat._id, page: 1 })}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                filters.categoryId === cat._id
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              }`}
            >
              <span className="truncate">{cat.name}</span>
              {typeof cat.jobCount === "number" && (
                <span className="text-[10px] opacity-70 ml-2">{cat.jobCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Workplace Type */}
      <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Workplace Model
        </label>
        <div className="flex flex-col gap-1">
          {LOCATION_TYPES.map((lt) => (
            <label
              key={lt.value}
              className="flex items-center gap-2 text-xs font-semibold cursor-pointer py-1 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <input
                type="radio"
                name="locationType"
                value={lt.value}
                checked={(filters.locationType || "") === lt.value}
                onChange={() => onChange({ locationType: lt.value, page: 1 })}
                className="accent-black dark:accent-white"
              />
              <span>{lt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Job Type */}
      <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Employment Type
        </label>
        <div className="flex flex-col gap-1">
          {JOB_TYPES.map((jt) => (
            <label
              key={jt.value}
              className="flex items-center gap-2 text-xs font-semibold cursor-pointer py-1 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <input
                type="radio"
                name="type"
                value={jt.value}
                checked={(filters.type || "") === jt.value}
                onChange={() => onChange({ type: jt.value, page: 1 })}
                className="accent-black dark:accent-white"
              />
              <span>{jt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Experience Level
        </label>
        <div className="flex flex-col gap-1">
          {EXPERIENCE_LEVELS.map((el) => (
            <label
              key={el.value}
              className="flex items-center gap-2 text-xs font-semibold cursor-pointer py-1 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <input
                type="radio"
                name="experienceLevel"
                value={el.value}
                checked={(filters.experienceLevel || "") === el.value}
                onChange={() => onChange({ experienceLevel: el.value, page: 1 })}
                className="accent-black dark:accent-white"
              />
              <span>{el.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Minimum Salary */}
      <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Minimum Salary
        </label>
        <div className="flex flex-col gap-1">
          {SALARY_THRESHOLDS.map((st) => (
            <label
              key={st.value}
              className="flex items-center gap-2 text-xs font-semibold cursor-pointer py-1 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <input
                type="radio"
                name="salaryMin"
                value={st.value}
                checked={(filters.salaryMin || 0) === st.value}
                onChange={() => onChange({ salaryMin: st.value, page: 1 })}
                className="accent-black dark:accent-white"
              />
              <span>{st.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
