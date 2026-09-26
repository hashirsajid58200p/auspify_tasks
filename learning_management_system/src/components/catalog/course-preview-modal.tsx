"use client";

import { useState } from "react";
import { PlayCircle, FileText, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MarkdownView } from "@/components/ui/markdown-view";

interface PreviewLesson {
  _id: string;
  title: string;
  type: "VIDEO" | "TEXT";
  durationMin: number;
}

interface CoursePreviewModalProps {
  lesson: PreviewLesson | null;
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
}

export function CoursePreviewModal({
  lesson,
  isOpen,
  onClose,
  courseTitle,
}: CoursePreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [lessonDetail, setLessonDetail] = useState<{
    videoUrl?: string | null;
    content?: string;
  } | null>(null);

  // Fetch preview lesson details on open
  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      onClose();
      setLessonDetail(null);
      return;
    }

    if (lesson) {
      setLoading(true);
      try {
        const res = await fetch(`/api/lessons/${lesson._id}`);
        if (res.ok) {
          const json = await res.json();
          setLessonDetail(json.data.lesson);
        }
      } catch (err) {
        console.error("Failed to load preview lesson", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-card border-border">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              Preview Lesson
            </Badge>
            <span className="text-xs text-muted-foreground">{courseTitle}</span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground mt-2">
            {lesson?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {loading ? (
            <div className="aspect-video w-full flex items-center justify-center bg-muted/40 rounded-xl animate-pulse">
              <span className="text-xs text-muted-foreground">Loading preview...</span>
            </div>
          ) : lesson?.type === "VIDEO" && lessonDetail?.videoUrl ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md">
              <iframe
                src={lessonDetail.videoUrl}
                title={lesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : lessonDetail?.content ? (
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <MarkdownView content={lessonDetail.content} />
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">
              Preview content is currently unavailable.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
