"use client";

import * as React from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownView } from "@/components/ui/markdown-view";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { ALLOWED_THUMBNAIL_HOSTS } from "@/lib/thumbnail";
import { CourseWithCurriculum } from "@/server/services/courses";

interface CourseDetailsTabProps {
  course: CourseWithCurriculum;
}

export function CourseDetailsTab({ course }: CourseDetailsTabProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = React.useState(course.title);
  const [summary, setSummary] = React.useState(course.summary);
  const [description, setDescription] = React.useState(course.description || "");
  const [categoryId, setCategoryId] = React.useState(
    course.category?.id || (course.categoryId as unknown as string) || ""
  );
  const [level, setLevel] = React.useState<string>(course.level || "BEGINNER");
  const [thumbnailUrl, setThumbnailUrl] = React.useState(course.thumbnailUrl || "");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetchApi<{ id: string; name: string }[]>("/api/categories");
      return res || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await fetchApi(`/api/instructor/courses/${course.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          description: description.trim(),
          categoryId,
          level,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Course details saved!");
      queryClient.invalidateQueries({ queryKey: ["course-builder", course.id] });
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      setErrorMessage(null);
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to save changes.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage("Title must be at least 3 characters");
      return;
    }
    if (!summary.trim() || summary.trim().length < 10) {
      setErrorMessage("Summary must be at least 10 characters");
      return;
    }
    if (!categoryId) {
      setErrorMessage("Please select a category");
      return;
    }

    updateMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
          {errorMessage}
        </div>
      )}

      {/* Basic Metadata Card */}
      <Card className="p-5 sm:p-6 rounded-2xl border-border bg-card space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider text-[11px]">
          Course Metadata
        </h3>

        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs font-semibold">
            Course Title *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
            className="h-10 text-xs sm:text-sm rounded-xl"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Slug: /{course.slug}</span>
            <span>{title.length}/100</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="summary" className="text-xs font-semibold">
            Short Summary *
          </Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={300}
            rows={3}
            required
            className="text-xs sm:text-sm rounded-xl"
          />
          <div className="flex justify-end text-[10px] text-muted-foreground">
            {summary.length}/300
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-10 rounded-xl text-xs sm:text-sm">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs sm:text-sm">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Difficulty Level *</Label>
            <Select value={level} onValueChange={(val) => setLevel(val)}>
              <SelectTrigger className="h-10 rounded-xl text-xs sm:text-sm">
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="BEGINNER" className="text-xs sm:text-sm">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE" className="text-xs sm:text-sm">Intermediate</SelectItem>
                <SelectItem value="ADVANCED" className="text-xs sm:text-sm">Advanced</SelectItem>
                <SelectItem value="ALL_LEVELS" className="text-xs sm:text-sm">All Levels</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Media Card (Thumbnail) */}
      <Card className="p-5 sm:p-6 rounded-2xl border-border bg-card space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider text-[11px]">
          Course Cover Image
        </h3>

        <div className="space-y-1.5">
          <Label htmlFor="thumbnail" className="text-xs font-semibold">
            Cover Image URL (HTTPS required)
          </Label>
          <Input
            id="thumbnail"
            placeholder="https://images.unsplash.com/..."
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            className="h-10 text-xs sm:text-sm rounded-xl"
          />
          <p className="text-[10px] text-muted-foreground">
            Permitted domains: {ALLOWED_THUMBNAIL_HOSTS.slice(0, 5).join(", ")}, etc.
          </p>
        </div>

        {/* Thumbnail Live Preview */}
        {thumbnailUrl ? (
          <div className="relative aspect-video max-w-md w-full rounded-2xl overflow-hidden border border-border bg-muted/40">
            <Image
              src={thumbnailUrl}
              alt="Course Thumbnail Preview"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
              onError={() => toast.error("Could not load image from provided URL")}
            />
          </div>
        ) : (
          <div className="aspect-video max-w-md w-full rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center text-muted-foreground p-6 bg-muted/20">
            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">No thumbnail specified yet</p>
            <p className="text-[10px] opacity-70">A cover image is required prior to publishing.</p>
          </div>
        )}
      </Card>

      {/* Rich Markdown Description Card */}
      <Card className="p-5 sm:p-6 rounded-2xl border-border bg-card space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider text-[11px]">
            Comprehensive Syllabus & Description (Markdown)
          </h3>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            Sanitized Markdown
          </span>
        </div>

        <Tabs defaultValue="write" className="w-full">
          <TabsList className="h-8 rounded-lg p-0.5 bg-muted">
            <TabsTrigger value="write" className="text-xs px-3 h-7 rounded-md">
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs px-3 h-7 rounded-md">
              Live Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="mt-2">
            <Textarea
              placeholder="Provide a detailed course syllabus, prerequisites, key learning outcomes, and technology stack in Markdown..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={12}
              className="text-xs sm:text-sm font-mono rounded-xl resize-y"
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-2">
            <div className="min-h-[280px] p-5 rounded-xl border border-border bg-muted/20">
              <MarkdownView content={description} />
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          className="rounded-xl text-xs font-semibold px-6 shadow-sm"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Course Details
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
