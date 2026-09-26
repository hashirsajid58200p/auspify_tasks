import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-2xl bg-primary/10 p-4 text-primary mb-4 font-mono font-bold text-2xl">
        404
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Page Not Found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        The resource you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </div>
    </div>
  );
}
