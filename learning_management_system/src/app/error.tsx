"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log minimal error in dev, never leak stack trace in prod
    console.error("Application error:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-2xl bg-destructive/10 p-4 text-destructive mb-4 font-mono font-bold text-2xl">
        Error
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        An unexpected error occurred. Please try again or return to the dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go to Home
        </Button>
      </div>
    </div>
  );
}
