"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Globe,
  Archive,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchApi, ApiClientError } from "@/lib/api-client";

interface PublishReadiness {
  ready: boolean;
  issues: string[];
}

interface PublishModalProps {
  courseId: string;
  currentStatus: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishModal({
  courseId,
  currentStatus,
  open,
  onOpenChange,
}: PublishModalProps) {
  const queryClient = useQueryClient();

  const { data: readiness, isLoading, refetch } = useQuery<PublishReadiness>({
    queryKey: ["course-publish-readiness", courseId],
    queryFn: async () => {
      const res = await fetchApi<PublishReadiness>(
        `/api/instructor/courses/${courseId}/publish`
      );
      return res || { ready: false, issues: [] };
    },
    enabled: open,
  });

  const statusMutation = useMutation({
    mutationFn: async (action: "PUBLISH" | "UNPUBLISH" | "ARCHIVE") => {
      return await fetchApi(`/api/instructor/courses/${courseId}/publish`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
    },
    onSuccess: (_, action) => {
      toast.success(
        action === "PUBLISH"
          ? "Course published successfully! It is now live in the catalog."
          : action === "UNPUBLISH"
          ? "Course unpublished and returned to Draft status."
          : "Course archived."
      );
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      onOpenChange(false);
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update course status.");
      }
    },
  });

  const isPublished = currentStatus === "PUBLISHED";
  const isArchived = currentStatus === "ARCHIVED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Course Publishing Center
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Review the publishing verification checklist before making your course public.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : isPublished ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">This course is currently LIVE</p>
                  <p className="mt-0.5 text-emerald-700 dark:text-emerald-400/90 text-[11px]">
                    Students can find this course in the public catalog and enroll.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-xs justify-start h-9"
                  onClick={() => statusMutation.mutate("UNPUBLISH")}
                  disabled={statusMutation.isPending}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Unpublish to Draft (Hide from catalog)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-xs justify-start h-9 text-destructive hover:bg-destructive/10"
                  onClick={() => statusMutation.mutate("ARCHIVE")}
                  disabled={statusMutation.isPending}
                >
                  <Archive className="w-3.5 h-3.5 mr-2" />
                  Archive Course (Retains existing student access)
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px]">
                Publishing Requirements Checklist:
              </div>

              <div className="space-y-2 border border-border/80 rounded-xl p-3.5 bg-muted/40">
                {readiness?.issues.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    All requirements satisfied! Ready to publish.
                  </div>
                ) : (
                  readiness?.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-destructive">
                      <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{issue}</span>
                    </div>
                  ))
                )}
              </div>

              {!readiness?.ready && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    Resolve the issues above in the Details and Curriculum tabs before publishing.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          {!isPublished && (
            <Button
              type="button"
              size="sm"
              className="rounded-xl text-xs font-semibold"
              disabled={!readiness?.ready || statusMutation.isPending}
              onClick={() => statusMutation.mutate("PUBLISH")}
            >
              {statusMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Course Now"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
