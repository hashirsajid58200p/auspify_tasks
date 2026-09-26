"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { ClassWithCounts } from "@/types/class";
import { ClassTable } from "@/components/classes/class-table";
import { ClassCard } from "@/components/classes/class-card";
import { ClassFormDialog } from "@/components/classes/class-form-dialog";
import { DeleteClassDialog } from "@/components/classes/delete-class-dialog";
import { ClassMetrics } from "@/components/classes/class-metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, School, AlertCircle, RefreshCw } from "lucide-react";

export default function ClassesPage() {
  const [search, setSearch] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<ClassWithCounts | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deletingClass, setDeletingClass] = React.useState<ClassWithCounts | null>(null);

  const {
    data: classes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ClassWithCounts[]>({
    queryKey: ["classes"],
    queryFn: () => api.get<ClassWithCounts[]>("/api/classes"),
  });

  const filteredClasses = React.useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.toLowerCase().trim();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.gradeLevel.toLowerCase().includes(q) ||
        c.homeroomTeacherName.toLowerCase().includes(q),
    );
  }, [classes, search]);

  const stats = React.useMemo(() => {
    const totalClasses = classes.length;
    const totalEnrolled = classes.reduce((sum, c) => sum + c.enrolledCount, 0);
    const totalActive = classes.reduce((sum, c) => sum + c.activeCount, 0);
    const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
    const overallUtilization =
      totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

    return { totalClasses, totalEnrolled, totalActive, totalCapacity, overallUtilization };
  }, [classes]);

  const handleOpenCreate = () => {
    setEditingClass(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cls: ClassWithCounts) => {
    setEditingClass(cls);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (cls: ClassWithCounts) => {
    setDeletingClass(cls);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage grade levels, homeroom cohorts, and enrollment capacities.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="self-start sm:self-auto shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* KPI Overview Metrics */}
      <ClassMetrics stats={stats} />

      {/* Filter and search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes or teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <div className="hidden md:block">
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            <Skeleton className="h-44 w-full rounded-lg" />
            <Skeleton className="h-44 w-full rounded-lg" />
            <Skeleton className="h-44 w-full rounded-lg" />
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Failed to load classes</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "An error occurred while fetching classes."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredClasses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <School className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-semibold text-lg">No classes found</h3>
              <p className="text-sm text-muted-foreground">
                {search.trim()
                  ? `No classes matched "${search}". Try adjusting your search.`
                  : "Get started by adding the first class group to the system."}
              </p>
            </div>
            {!search.trim() && (
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Class
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Desktop view */}
      {!isLoading && !isError && filteredClasses.length > 0 && (
        <div className="hidden md:block">
          <ClassTable
            classes={filteredClasses}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        </div>
      )}

      {/* Mobile view */}
      {!isLoading && !isError && filteredClasses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
          {filteredClasses.map((cls) => (
            <ClassCard key={cls.id} cls={cls} onEdit={handleOpenEdit} onDelete={handleOpenDelete} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ClassFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} classToEdit={editingClass} />
      <DeleteClassDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        classToDelete={deletingClass}
      />
    </div>
  );
}
