import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-4 max-w-md">
        <h1 className="text-6xl font-bold font-display tracking-tight text-foreground">404</h1>
        <h2 className="text-xl font-semibold text-foreground">Page Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested page could not be located within the student management system.
        </p>
        <div className="pt-2">
          <Button asChild variant="default" className="gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
