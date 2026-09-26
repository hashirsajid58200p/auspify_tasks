"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Video,
  FileText,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownView } from "@/components/ui/markdown-view";
import { parseVideoUrl } from "@/lib/video";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { ILesson } from "@/server/models/lesson";

interface LessonModalProps {
  courseId: string;
  moduleId: string;
  lesson?: ILesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LessonFormProps {
  courseId: string;
  moduleId: string;
  lesson?: ILesson | null;
  onClose: () => void;
}

function LessonForm({ courseId, moduleId, lesson, onClose }: LessonFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!lesson;

  const [title, setTitle] = React.useState(lesson?.title || "");
  const [type, setType] = React.useState<"VIDEO" | "TEXT">(lesson?.type || "TEXT");
  const [content, setContent] = React.useState(lesson?.content || "");
  const [videoUrl, setVideoUrl] = React.useState(lesson?.videoUrl || "");
  const [durationMin, setDurationMin] = React.useState<number>(lesson?.durationMin ?? 10);
  const [isPreview, setIsPreview] = React.useState<boolean>(lesson?.isPreview ?? false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const parsedVideo = React.useMemo(() => {
    if (type !== "VIDEO" || !videoUrl.trim()) return null;
    return parseVideoUrl(videoUrl.trim());
  }, [type, videoUrl]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditing && lesson) {
        return await fetchApi(`/api/instructor/courses/${courseId}/lessons`, {
          method: "PATCH",
          body: JSON.stringify({
            lessonId: lesson._id.toString(),
            title: title.trim(),
            type,
            content: type === "TEXT" ? content : "",
            videoUrl: type === "VIDEO" ? videoUrl.trim() : "",
            durationMin: Number(durationMin) || 0,
            isPreview,
          }),
        });
      } else {
        return await fetchApi(`/api/instructor/courses/${courseId}/lessons`, {
          method: "POST",
          body: JSON.stringify({
            moduleId,
            title: title.trim(),
            type,
            content: type === "TEXT" ? content : "",
            videoUrl: type === "VIDEO" ? videoUrl.trim() : "",
            durationMin: Number(durationMin) || 0,
            isPreview,
          }),
        });
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Lesson updated successfully!" : "Lesson created successfully!");
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save lesson. Please verify all fields.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || title.trim().length < 2) {
      setFormError("Lesson title must be at least 2 characters");
      return;
    }

    if (type === "VIDEO") {
      if (!videoUrl.trim()) {
        setFormError("Video URL is required for video lessons");
        return;
      }
      if (!parsedVideo) {
        setFormError("Please enter a valid YouTube or Vimeo URL");
        return;
      }
    }

    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          {isEditing ? "Edit Lesson" : "Add New Lesson"}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Configure lesson content, duration, and accessibility.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {formError && (
          <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Lesson Title */}
        <div className="space-y-1.5">
          <Label htmlFor="lesson-title" className="text-xs font-semibold">
            Lesson Title *
          </Label>
          <Input
            id="lesson-title"
            placeholder="e.g. Introduction to Server Components"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            className="h-10 text-xs sm:text-sm rounded-xl"
          />
        </div>

        {/* Lesson Type Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Lesson Format</Label>
          <RadioGroup
            value={type}
            onValueChange={(val) => setType(val as "VIDEO" | "TEXT")}
            className="grid grid-cols-2 gap-3"
          >
            <div>
              <RadioGroupItem value="TEXT" id="type-text" className="sr-only peer" />
              <Label
                htmlFor="type-text"
                className="flex items-center gap-2 p-3 rounded-xl border border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-secondary/50"
              >
                <FileText className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold">Markdown Text</p>
                  <p className="text-[10px] text-muted-foreground">Rich text, code blocks & math</p>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="VIDEO" id="type-video" className="sr-only peer" />
              <Label
                htmlFor="type-video"
                className="flex items-center gap-2 p-3 rounded-xl border border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-secondary/50"
              >
                <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold">Video Lesson</p>
                  <p className="text-[10px] text-muted-foreground">YouTube or Vimeo embed</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Video URL Input and Live Preview */}
        {type === "VIDEO" && (
          <div className="space-y-3 p-3.5 rounded-xl border border-border/80 bg-muted/30">
            <div className="space-y-1.5">
              <Label htmlFor="video-url" className="text-xs font-semibold">
                Video URL (YouTube or Vimeo) *
              </Label>
              <Input
                id="video-url"
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="h-10 text-xs sm:text-sm rounded-xl bg-background"
              />
              <p className="text-[10px] text-muted-foreground">
                Only privacy-friendly YouTube and Vimeo embeds are permitted.
              </p>
            </div>

            {parsedVideo && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Valid {parsedVideo.platform} video detected: {parsedVideo.videoId}
                </div>
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-black">
                  <iframe
                    src={parsedVideo.embedUrl}
                    title="Video preview"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Markdown Text Editor & Live Preview */}
        {type === "TEXT" && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Lesson Content (Markdown)</Label>
            <Tabs defaultValue="write" className="w-full">
              <TabsList className="h-8 rounded-lg p-0.5 bg-muted">
                <TabsTrigger value="write" className="text-xs px-3 h-7 rounded-md">
                  Write
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs px-3 h-7 rounded-md">
                  Live Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="write" className="mt-2">
                <Textarea
                  placeholder="Write your lesson notes in Markdown... (headings, lists, code blocks, links)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={9}
                  className="text-xs sm:text-sm font-mono rounded-xl resize-y"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="min-h-[220px] max-h-[350px] overflow-y-auto p-4 rounded-xl border border-border bg-muted/20">
                  <MarkdownView content={content} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Additional Settings: Duration and Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
          <div className="space-y-1.5">
            <Label htmlFor="duration" className="text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              Estimated Duration (Minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              min={0}
              max={600}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="h-10 text-xs sm:text-sm rounded-xl"
            />
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="is-preview"
              checked={isPreview}
              onCheckedChange={(checked) => setIsPreview(!!checked)}
            />
            <div className="grid gap-0.5 leading-none">
              <Label
                htmlFor="is-preview"
                className="text-xs font-medium cursor-pointer flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                Free Preview Lesson
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Publicly accessible to prospective students before enrolling.
              </p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl text-xs"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="rounded-xl text-xs font-semibold"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            "Update Lesson"
          ) : (
            "Create Lesson"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function LessonModal({
  courseId,
  moduleId,
  lesson,
  open,
  onOpenChange,
}: LessonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        {open && (
          <LessonForm
            key={lesson?._id?.toString() || `new-${moduleId}`}
            courseId={courseId}
            moduleId={moduleId}
            lesson={lesson}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
