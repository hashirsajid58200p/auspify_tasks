"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CourseDetailActionsProps {
  courseId: string;
  courseSlug: string;
  isLoggedIn: boolean;
  isEnrolled: boolean;
  progressPct?: number;
}

export function CourseDetailActions({
  courseId,
  courseSlug,
  isLoggedIn,
  isEnrolled,
  progressPct = 0,
}: CourseDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/courses/${courseSlug}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.error?.message || "Failed to enroll in course");
      }

      toast.success("Successfully enrolled! Redirecting to course player...");
      router.push(`/learn/${courseSlug}`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setLoading(false);
    }
  };

  if (isEnrolled) {
    return (
      <Button
        size="lg"
        onClick={() => router.push(`/learn/${courseSlug}`)}
        className="w-full rounded-xl h-12 text-sm font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
      >
        <PlayCircle className="w-5 h-5" />
        {progressPct > 0 ? `Continue Learning (${progressPct}%)` : "Start Learning"}
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      disabled={loading}
      onClick={handleEnroll}
      className="w-full rounded-xl h-12 text-sm font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Enrolling...
        </>
      ) : isLoggedIn ? (
        <>
          <CheckCircle2 className="w-5 h-5" />
          Enroll in Course (Free)
        </>
      ) : (
        <>
          Sign in to Enroll (Free)
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </Button>
  );
}
