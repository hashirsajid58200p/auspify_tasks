"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FolderPlus,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Video,
  FileText,
  Clock,
  Eye,
  Layers,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LessonModal } from "@/components/instructor/builder/lesson-modal";
import { fetchApi } from "@/lib/api-client";
import { IModule } from "@/server/models/module";
import { ILesson } from "@/server/models/lesson";

interface CurriculumModule extends IModule {
  id: string;
  lessons: Array<ILesson & { id: string }>;
}

interface CurriculumTabProps {
  courseId: string;
  modules: CurriculumModule[];
}

export function CurriculumTab({ courseId, modules }: CurriculumTabProps) {
  const queryClient = useQueryClient();

  // Module creation state
  const [isAddingModule, setIsAddingModule] = React.useState(false);
  const [newModuleTitle, setNewModuleTitle] = React.useState("");

  // Module editing state
  const [editingModuleId, setEditingModuleId] = React.useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = React.useState("");

  // Lesson modal state
  const [lessonModalOpen, setLessonModalOpen] = React.useState(false);
  const [targetModuleId, setTargetModuleId] = React.useState<string>("");
  const [editingLesson, setEditingLesson] = React.useState<ILesson | null>(null);

  // Module Mutations
  const createModuleMutation = useMutation({
    mutationFn: async (title: string) => {
      return await fetchApi(`/api/instructor/courses/${courseId}/modules`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
    },
    onSuccess: () => {
      toast.success("Module added successfully!");
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
      setIsAddingModule(false);
      setNewModuleTitle("");
    },
    onError: () => toast.error("Failed to add module."),
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ moduleId, title }: { moduleId: string; title: string }) => {
      return await fetchApi(`/api/instructor/courses/${courseId}/modules`, {
        method: "PATCH",
        body: JSON.stringify({ moduleId, title }),
      });
    },
    onSuccess: () => {
      toast.success("Module updated!");
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
      setEditingModuleId(null);
    },
    onError: () => toast.error("Failed to update module."),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      return await fetchApi(`/api/instructor/courses/${courseId}/modules?moduleId=${moduleId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("Module and its lessons deleted.");
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
    },
    onError: () => toast.error("Failed to delete module."),
  });

  const reorderModulesMutation = useMutation({
    mutationFn: async (moduleIds: string[]) => {
      return await fetchApi(`/api/instructor/courses/${courseId}/modules`, {
        method: "PUT",
        body: JSON.stringify({ moduleIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
    },
  });

  // Lesson Mutations
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return await fetchApi(`/api/instructor/courses/${courseId}/lessons?lessonId=${lessonId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("Lesson deleted.");
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
    },
    onError: () => toast.error("Failed to delete lesson."),
  });

  const reorderLessonsMutation = useMutation({
    mutationFn: async ({
      moduleId,
      lessonIds,
    }: {
      moduleId: string;
      lessonIds: string[];
    }) => {
      return await fetchApi(`/api/instructor/courses/${courseId}/lessons`, {
        method: "PUT",
        body: JSON.stringify({ moduleId, lessonIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
    },
  });

  // Reorder Handlers
  const handleMoveModule = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const newModules = [...modules];
    const [moved] = newModules.splice(index, 1);
    newModules.splice(targetIndex, 0, moved);

    const moduleIds = newModules.map((m) => m._id.toString());
    reorderModulesMutation.mutate(moduleIds);
  };

  const handleMoveLesson = (
    module: CurriculumModule,
    lessonIndex: number,
    direction: "up" | "down"
  ) => {
    const targetIndex = direction === "up" ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= module.lessons.length) return;

    const newLessons = [...module.lessons];
    const [moved] = newLessons.splice(lessonIndex, 1);
    newLessons.splice(targetIndex, 0, moved);

    const lessonIds = newLessons.map((l) => l._id.toString());
    reorderLessonsMutation.mutate({
      moduleId: module._id.toString(),
      lessonIds,
    });
  };

  const handleOpenAddLesson = (moduleId: string) => {
    setTargetModuleId(moduleId);
    setEditingLesson(null);
    setLessonModalOpen(true);
  };

  const handleOpenEditLesson = (moduleId: string, lesson: ILesson) => {
    setTargetModuleId(moduleId);
    setEditingLesson(lesson);
    setLessonModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Curriculum Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Curriculum Structure
          </h2>
          <p className="text-xs text-muted-foreground">
            Organize modules and lessons. Drag or use the up/down controls to sequence your content.
          </p>
        </div>

        {!isAddingModule && (
          <Button
            size="sm"
            onClick={() => setIsAddingModule(true)}
            className="rounded-xl text-xs gap-1.5 self-start sm:self-auto"
          >
            <FolderPlus className="w-4 h-4" />
            Add Section / Module
          </Button>
        )}
      </div>

      {/* Add Module Inline Form */}
      {isAddingModule && (
        <Card className="p-4 rounded-2xl border-primary/40 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              New Course Module
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="e.g. Module 1: Foundational Architecture"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              className="text-xs sm:text-sm h-10 rounded-xl bg-background"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="rounded-xl text-xs font-semibold h-10 px-4"
                disabled={!newModuleTitle.trim() || createModuleMutation.isPending}
                onClick={() => createModuleMutation.mutate(newModuleTitle.trim())}
              >
                {createModuleMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                Save Module
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs h-10"
                onClick={() => {
                  setIsAddingModule(false);
                  setNewModuleTitle("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modules List */}
      {modules.length === 0 && !isAddingModule ? (
        <Card className="p-10 rounded-2xl border-border text-center bg-card shadow-sm">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">No curriculum modules yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Courses require at least one module and one lesson to publish. Start by adding a module.
          </p>
          <Button
            size="sm"
            onClick={() => setIsAddingModule(true)}
            className="mt-4 rounded-xl text-xs"
          >
            <FolderPlus className="w-4 h-4 mr-1.5" />
            Add First Module
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((mod, modIdx) => (
            <Card
              key={mod.id}
              className="rounded-2xl border-border bg-card overflow-hidden shadow-sm hover:border-primary/30 transition-all"
            >
              {/* Module Header Bar */}
              <div className="p-3.5 sm:p-4 bg-muted/40 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {modIdx + 1}
                  </span>

                  {editingModuleId === mod.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingModuleTitle}
                        onChange={(e) => setEditingModuleTitle(e.target.value)}
                        className="h-8 text-xs rounded-lg bg-background"
                      />
                      <Button
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                        onClick={() =>
                          updateModuleMutation.mutate({
                            moduleId: mod.id,
                            title: editingModuleTitle.trim(),
                          })
                        }
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => setEditingModuleId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {mod.title}
                    </h3>
                  )}

                  <Badge variant="secondary" className="text-[10px] ml-2 shrink-0">
                    {mod.lessons.length} {mod.lessons.length === 1 ? "lesson" : "lessons"}
                  </Badge>
                </div>

                {/* Module Actions */}
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    disabled={modIdx === 0}
                    onClick={() => handleMoveModule(modIdx, "up")}
                    aria-label="Move module up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    disabled={modIdx === modules.length - 1}
                    onClick={() => handleMoveModule(modIdx, "down")}
                    aria-label="Move module down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => {
                      setEditingModuleId(mod.id);
                      setEditingModuleTitle(mod.title);
                    }}
                    aria-label="Edit module title"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (
                        confirm(
                          `Delete module "${mod.title}" and its ${mod.lessons.length} lessons?`
                        )
                      ) {
                        deleteModuleMutation.mutate(mod.id);
                      }
                    }}
                    aria-label="Delete module"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Module Lessons Container */}
              <div className="p-3 sm:p-4 space-y-2">
                {mod.lessons.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border/80 text-center">
                    <p className="text-xs text-muted-foreground">No lessons in this module yet.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-xs rounded-xl h-8"
                      onClick={() => handleOpenAddLesson(mod.id)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add First Lesson
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {mod.lessons.map((lesson, lessonIdx) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="text-[11px] font-mono text-muted-foreground w-4 text-center shrink-0">
                            {lessonIdx + 1}
                          </span>

                          {lesson.type === "VIDEO" ? (
                            <Video className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                          )}

                          <span className="text-xs font-medium text-foreground truncate">
                            {lesson.title}
                          </span>

                          {lesson.isPreview && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shrink-0"
                            >
                              <Eye className="w-2.5 h-2.5 mr-0.5" />
                              Preview
                            </Badge>
                          )}

                          {lesson.durationMin > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0 hidden sm:flex">
                              <Clock className="w-2.5 h-2.5" />
                              {lesson.durationMin}m
                            </span>
                          )}
                        </div>

                        {/* Lesson Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            disabled={lessonIdx === 0}
                            onClick={() => handleMoveLesson(mod, lessonIdx, "up")}
                            aria-label="Move lesson up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            disabled={lessonIdx === mod.lessons.length - 1}
                            onClick={() => handleMoveLesson(mod, lessonIdx, "down")}
                            aria-label="Move lesson down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleOpenEditLesson(mod.id, lesson)}
                            aria-label="Edit lesson"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm(`Delete lesson "${lesson.title}"?`)) {
                                deleteLessonMutation.mutate(lesson.id);
                              }
                            }}
                            aria-label="Delete lesson"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 text-xs rounded-xl h-8 border-dashed"
                      onClick={() => handleOpenAddLesson(mod.id)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Another Lesson
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lesson Creation/Editing Modal */}
      <LessonModal
        courseId={courseId}
        moduleId={targetModuleId}
        lesson={editingLesson}
        open={lessonModalOpen}
        onOpenChange={setLessonModalOpen}
      />
    </div>
  );
}
