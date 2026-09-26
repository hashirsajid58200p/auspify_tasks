"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Calendar,
  Award,
  Layers,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AssignmentModal,
  AssignmentFormData,
} from "@/components/instructor/builder/assignment-modal";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { IModule } from "@/server/models/module";

interface AssignmentsTabProps {
  courseId: string;
  modules: Array<{ id?: string; _id?: unknown; title: string }>;
}

interface AssignmentItem {
  _id: string;
  courseId: string;
  moduleId?: string | null;
  title: string;
  instructions: string;
  dueAt?: string | null;
  maxPoints: number;
  allowLate: boolean;
  isRequired: boolean;
  createdAt: string;
}

export function AssignmentsTab({ courseId, modules }: AssignmentsTabProps) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    React.useState<AssignmentFormData | null>(null);
  const [deleteAssignmentId, setDeleteAssignmentId] = React.useState<string | null>(
    null
  );

  const {
    data: assignments,
    isLoading,
    isError,
  } = useQuery<AssignmentItem[]>({
    queryKey: ["instructor-assignments", courseId],
    queryFn: async () => {
      const res = await fetchApi<AssignmentItem[]>(
        `/api/instructor/courses/${courseId}/assignments`
      );
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await fetchApi(
        `/api/instructor/courses/${courseId}/assignments/${assignmentId}`,
        {
          method: "DELETE",
        }
      );
    },
    onSuccess: () => {
      toast.success("Assignment deleted successfully.");
      queryClient.invalidateQueries({
        queryKey: ["instructor-assignments", courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
      setDeleteAssignmentId(null);
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete assignment.");
      }
      setDeleteAssignmentId(null);
    },
  });

  const handleOpenCreate = () => {
    setSelectedAssignment(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (asgn: AssignmentItem) => {
    setSelectedAssignment({
      _id: asgn._id,
      title: asgn.title,
      instructions: asgn.instructions,
      moduleId: asgn.moduleId || null,
      dueAt: asgn.dueAt || null,
      maxPoints: asgn.maxPoints,
      allowLate: asgn.allowLate,
      isRequired: asgn.isRequired,
    });
    setModalOpen(true);
  };

  const moduleMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of modules) {
      const id = (m.id || m._id)?.toString();
      if (id) {
        map.set(id, m.title);
      }
    }
    return map;
  }, [modules]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-pulse">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center rounded-2xl border-destructive/20 bg-destructive/5 text-destructive max-w-md mx-auto">
        <p className="text-xs">Failed to load assignments. Please refresh.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Course Assignments ({assignments?.length || 0})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add open-ended assignments, project tasks, and code review deliverables.
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-xl text-xs gap-1.5 self-start sm:self-auto shrink-0"
          onClick={handleOpenCreate}
        >
          <Plus className="w-3.5 h-3.5" />
          Create Assignment
        </Button>
      </div>

      {/* Assignments List */}
      {!assignments || assignments.length === 0 ? (
        <Card className="p-10 text-center rounded-2xl border-dashed border-border bg-card/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              No Assignments Created Yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Create homework or project submissions where students submit written responses and project links.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs gap-1.5"
            onClick={handleOpenCreate}
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Assignment
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignments.map((asgn) => {
            const moduleName = asgn.moduleId ? moduleMap.get(asgn.moduleId) : null;
            const dueDate = asgn.dueAt ? new Date(asgn.dueAt) : null;

            return (
              <Card
                key={asgn._id}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {moduleName ? (
                      <Badge variant="secondary" className="text-[11px] font-normal gap-1">
                        <Layers className="w-3 h-3 text-muted-foreground" />
                        {moduleName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-muted-foreground">
                        Course-Level
                      </Badge>
                    )}
                    {asgn.isRequired ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px]">
                        Required
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[11px]">
                        Optional
                      </Badge>
                    )}
                    {asgn.allowLate ? (
                      <Badge variant="outline" className="text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Late Allowed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                        Hard Deadline
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-foreground truncate">
                    {asgn.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {asgn.instructions}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {asgn.maxPoints} Maximum Points
                    </span>
                    {dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        Due {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenEdit(asgn)}
                    title="Edit Assignment"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteAssignmentId(asgn._id)}
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deleteAssignmentId}
        onOpenChange={(open) => !open && setDeleteAssignmentId(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Delete Assignment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this assignment? Note: Assignments with existing student submissions cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteAssignmentId && deleteMutation.mutate(deleteAssignmentId)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assignment Modal */}
      <AssignmentModal
        courseId={courseId}
        modules={modules}
        assignment={selectedAssignment}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
