"use client";

import { ClassWithCounts } from "@/types/class";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, X } from "lucide-react";

interface StudentFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedClassId: string;
  onClassChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  classes: ClassWithCounts[];
  onExportCsv: () => void;
  isExporting: boolean;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function StudentFilters({
  search,
  onSearchChange,
  selectedClassId,
  onClassChange,
  selectedStatus,
  onStatusChange,
  classes,
  onExportCsv,
  isExporting,
  onReset,
  hasActiveFilters,
}: StudentFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Search & Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ID or name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Class Filter */}
        <select
          value={selectedClassId}
          onChange={(e) => onClassChange(e.target.value)}
          aria-label="Filter by class"
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="" className="bg-popover text-popover-foreground">
            All Classes
          </option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id} className="bg-popover text-popover-foreground">
              {cls.name} ({cls.gradeLevel})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by status"
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="" className="bg-popover text-popover-foreground">
            All Statuses
          </option>
          <option value="ACTIVE" className="bg-popover text-popover-foreground">
            Active
          </option>
          <option value="INACTIVE" className="bg-popover text-popover-foreground">
            Inactive
          </option>
          <option value="GRADUATED" className="bg-popover text-popover-foreground">
            Graduated
          </option>
          <option value="TRANSFERRED" className="bg-popover text-popover-foreground">
            Transferred
          </option>
        </select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Export Action */}
      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportCsv}
          disabled={isExporting}
          className="h-9 text-xs"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>
    </div>
  );
}
