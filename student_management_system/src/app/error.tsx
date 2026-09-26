"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client-side boundary errors without sensitive details
    console.error("Application error boundary triggered:", error.message);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-4 max-w-md">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An error occurred while loading this view. Please try reloading the page.
        </p>
        <div className="pt-2">
          <Button onClick={() => reset()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
