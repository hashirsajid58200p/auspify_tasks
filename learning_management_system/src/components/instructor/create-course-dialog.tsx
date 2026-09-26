"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { ALLOWED_THUMBNAIL_HOSTS } from "@/lib/thumbnail";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export function CreateCourseDialog({
  triggerText = "Create Course",
  triggerClassName = "",
}: {
  triggerText?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [level, setLevel] = React.useState("BEGINNER");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery<CategoryOption[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetchApi<{ id: string; name: string; slug: string }[]>("/api/categories");
      return res || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return await fetchApi<{ id: string }>("/api/instructor/courses", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          categoryId,
          level,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
        }),
      });
    },
    onSuccess: (data) => {
      toast.success("Course created successfully!");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      setOpen(false);
      resetForm();
      if (data?.id) {
        router.push(`/instructor/courses/${data.id}`);
      }
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        setFormError("Failed to create course. Please verify your inputs.");
      }
    },
  });

  const resetForm = () => {
    setTitle("");
    setSummary("");
    setCategoryId("");
    setLevel("BEGINNER");
    setThumbnailUrl("");
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || title.trim().length < 3) {
      setFormError("Title must be at least 3 characters");
      return;
    }
    if (!summary.trim() || summary.trim().length < 10) {
      setFormError("Summary must be at least 10 characters");
      return;
    }
    if (!categoryId) {
      setFormError("Please select a course category");
      return;
    }

    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={`rounded-xl shadow-sm ${triggerClassName}`}>
          <Plus className="w-4 h-4 mr-1.5" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Course</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define the course basics. You will configure curriculum modules and lessons in the next step.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {formError && (
              <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">
                Course Title *
              </Label>
              <Input
                id="title"
                placeholder="e.g. Modern Full-Stack Development with Next.js 16"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
              <div className="flex justify-end text-[10px] text-muted-foreground">
                {title.length}/100
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="summary" className="text-xs font-semibold">
                Short Summary *
              </Label>
              <Textarea
                id="summary"
                placeholder="Describe what students will achieve in this course in 2-3 sentences..."
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <Label className="text-xs font-semibold">Level *</Label>
                <Select value={level} onValueChange={setLevel}>
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

            <div className="space-y-1.5">
              <Label htmlFor="thumbnailUrl" className="text-xs font-semibold">
                Thumbnail Image URL (Optional)
              </Label>
              <Input
                id="thumbnailUrl"
                placeholder="https://images.unsplash.com/..."
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground">
                Allowed domains: {ALLOWED_THUMBNAIL_HOSTS.slice(0, 4).join(", ")}, etc.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-semibold"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
