"use client";

import { useState } from "react";
import { Video, FileText, Lock, PlayCircle, Clock } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CoursePreviewModal } from "./course-preview-modal";

interface LessonItem {
  _id: string;
  title: string;
  order: number;
  type: "VIDEO" | "TEXT";
  durationMin: number;
  isPreview: boolean;
}

interface ModuleItem {
  _id: string;
  title: string;
  order: number;
  lessons: LessonItem[];
}

interface CourseCurriculumAccordionProps {
  modules: ModuleItem[];
  courseTitle: string;
}

export function CourseCurriculumAccordion({
  modules,
  courseTitle,
}: CourseCurriculumAccordionProps) {
  const [previewLesson, setPreviewLesson] = useState<LessonItem | null>(null);

  const defaultValues = modules.slice(0, 2).map((m) => m._id);

  return (
    <>
      <Accordion
        type="multiple"
        defaultValue={defaultValues}
        className="w-full space-y-3"
      >
        {modules.map((mod, index) => {
          const modDuration = mod.lessons.reduce((acc, l) => acc + (l.durationMin || 0), 0);

          return (
            <AccordionItem
              key={mod._id}
              value={mod._id}
              className="border border-border rounded-xl bg-card overflow-hidden px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-6">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-semibold text-sm sm:text-base text-foreground">
                      {mod.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 pl-8 sm:pl-0">
                    <span>
                      {mod.lessons.length} {mod.lessons.length === 1 ? "lesson" : "lessons"}
                    </span>
                    {modDuration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {modDuration} min
                      </span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-1 pb-4">
                <div className="space-y-1.5 border-t border-border/50 pt-2">
                  {mod.lessons.map((lesson) => (
                    <div
                      key={lesson._id}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {lesson.type === "VIDEO" ? (
                          <Video className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate text-foreground/90 font-medium">
                          {lesson.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {lesson.durationMin > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {lesson.durationMin}m
                          </span>
                        )}

                        {lesson.isPreview ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewLesson(lesson);
                            }}
                            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Preview
                          </button>
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <CoursePreviewModal
        lesson={previewLesson}
        isOpen={!!previewLesson}
        onClose={() => setPreviewLesson(null)}
        courseTitle={courseTitle}
      />
    </>
  );
}
