"use client";

import * as React from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";

interface SaveButtonProps {
  jobId: string;
  initialSaved?: boolean;
  className?: string;
  variant?: "icon" | "full";
}

export function SaveButton({
  jobId,
  initialSaved = false,
  className = "",
  variant = "full",
}: SaveButtonProps) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [loading, setLoading] = React.useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      if (saved) {
        await fetchApi("/api/me/saved-jobs", {
          method: "DELETE",
          body: JSON.stringify({ jobId }),
        });
        setSaved(false);
        toast.success("Job removed from saved jobs");
      } else {
        await fetchApi("/api/me/saved-jobs", {
          method: "POST",
          body: JSON.stringify({ jobId }),
        });
        setSaved(true);
        toast.success("Job saved successfully!");
      }
    } catch {
      toast.error("Please sign in as a Job Seeker to bookmark jobs.");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`w-9 h-9 rounded-xl border-2 border-black flex items-center justify-center transition-all ${
          saved
            ? "bg-[#FF6B7A] text-white shadow-neo-sm"
            : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
        } ${className}`}
        aria-label={saved ? "Unsave job" : "Save job"}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Bookmark className={`w-4 h-4 ${saved ? "fill-white" : ""}`} />
        )}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-xl border-2 border-black font-bold flex items-center gap-2 ${
        saved ? "bg-[#FF6B7A]/10 text-[#FF6B7A] border-[#FF6B7A]" : ""
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Bookmark className={`w-4 h-4 ${saved ? "fill-[#FF6B7A]" : ""}`} />
      )}
      <span>{saved ? "Saved" : "Save Job"}</span>
    </Button>
  );
}
