"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client boundary errors in development
    console.error("App boundary error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 rounded-3xl border-4 border-black bg-[#E7000B] text-white flex items-center justify-center shadow-neo mb-6">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">
        Something Went Wrong
      </h1>
      <p className="text-muted-foreground text-sm md:text-base font-medium max-w-md mb-8 leading-relaxed">
        An unexpected error occurred while processing your request. Please try again.
      </p>
      <Button onClick={() => reset()} size="lg" className="rounded-2xl flex items-center gap-2">
        <RefreshCcw className="w-5 h-5" />
        <span>Try Again</span>
      </Button>
    </div>
  );
}
