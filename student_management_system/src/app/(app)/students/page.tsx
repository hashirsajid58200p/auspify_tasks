"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { generateCsv, downloadCsv } from "@/lib/csv";
import { StudentListItem } from "@/types/student";
import { ClassWithCounts } from "@/types/class";
import { StudentTable } from "@/components/students/student-table";
import { StudentCard } from "@/components/students/student-card";
import { StudentFilters } from "@/components/students/student-filters";
import { StudentFormDialog } from "@/components/students/student-form-dialog";
import { DeleteStudentDialog } from "@/components/students/delete-student-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface StudentsApiResponse {
  data: StudentListItem[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export default function StudentsPage() {
  const [search, setSearch] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [sortField, setSortField] = React.useState("-createdAt");
  const [page, setPage] = React.useState(1);
  const [isExporting, setIsExporting] = React.useState(false);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<StudentListItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deletingStudent, setDeletingStudent] = React.useState<StudentListItem | null>(null);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };
  const handleClassChange = (val: string) => {
    setClassFilter(val);
    setPage(1);
  };
  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };
  const handleResetFilters = () => {
    setSearch("");
    setClassFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const handleSortToggle = (field: string) => {
    setSortField((current) => (current === field ? `-${field}` : field));
    setPage(1);
  };

  const { data: classes = [] } = useQuery<ClassWithCounts[]>({
    queryKey: ["classes"],
    queryFn: () => api.get<ClassWithCounts[]>("/api/classes"),
  });

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    ...(search.trim() ? { q: search.trim() } : {}),
    ...(classFilter ? { classId: classFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    sort: sortField,
  }).toString();

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<StudentsApiResponse>({
    queryKey: ["students", queryParams],
    queryFn: () => api.get<StudentsApiResponse>(`/api/students?${queryParams}`),
  });

  const students = response?.data || [];
  const meta = response?.meta || { total: 0, totalPages: 1, page: 1, limit: 20 };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const exportParams = new URLSearchParams({
        page: "1",
        limit: "50",
        ...(search.trim() ? { q: search.trim() } : {}),
        ...(classFilter ? { classId: classFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        sort: sortField,
      }).toString();

      const exportData = await api.get<StudentsApiResponse>(`/api/students?${exportParams}`);
      const list = exportData.data || [];

      const headers = [
        "Student ID",
        "First Name",
        "Last Name",
        "Gender",
        "Class",
        "Grade",
        "Status",
        "Enrollment Date",
      ];

      const rows = list.map((s) => [
        s.studentId,
        s.firstName,
        s.lastName,
        s.gender,
        s.className || "Unassigned",
        s.classGradeLevel || "",
        s.status,
        s.enrollmentDate ? new Date(s.enrollmentDate).toISOString().split("T")[0] : "",
      ]);

      const csvContent = generateCsv(headers, rows);
      const filename = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
      downloadCsv(filename, csvContent);
      toast.success(`Exported ${list.length} student records.`);
    } catch {
      toast.error("Failed to export student records.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Directory of enrolled students, cohort assignments, and registration profiles.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingStudent(null);
            setIsFormOpen(true);
          }}
          className="self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Filter and Action Bar */}
      <StudentFilters
        search={search}
        onSearchChange={handleSearchChange}
        selectedClassId={classFilter}
        onClassChange={handleClassChange}
        selectedStatus={statusFilter}
        onStatusChange={handleStatusChange}
        classes={classes}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
        onReset={handleResetFilters}
        hasActiveFilters={!!search || !!classFilter || !!statusFilter}
      />

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          <div className="hidden md:block">
            <Skeleton className="h-72 w-full rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Failed to load students</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "An error occurred while loading students."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && students.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-semibold text-lg">No students found</h3>
              <p className="text-sm text-muted-foreground">
                {search || classFilter || statusFilter
                  ? "No students match your filter criteria. Try adjusting or clearing filters."
                  : "No students registered in the system yet. Add the first student."}
              </p>
            </div>
            {!search && !classFilter && !statusFilter && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Enroll First Student
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Desktop Table View */}
      {!isLoading && !isError && students.length > 0 && (
        <div className="hidden md:block">
          <StudentTable
            students={students}
            sortField={sortField}
            onSort={handleSortToggle}
            onEdit={(s) => {
              setEditingStudent(s);
              setIsFormOpen(true);
            }}
            onDelete={(s) => {
              setDeletingStudent(s);
              setIsDeleteOpen(true);
            }}
          />
        </div>
      )}

      {/* Mobile Card View */}
      {!isLoading && !isError && students.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
          {students.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              onEdit={(student) => {
                setEditingStudent(student);
                setIsFormOpen(true);
              }}
              onDelete={(student) => {
                setDeletingStudent(student);
                setIsDeleteOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && !isError && meta.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
          <div>
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} students
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <span className="px-2">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page >= meta.totalPages}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <StudentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        studentToEdit={editingStudent}
      />
      <DeleteStudentDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        student={deletingStudent}
      />
    </div>
  );
}
