import { ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Submissions Grading Queue",
};

export default function InstructorSubmissionsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-border/60">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Grading Queue
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Review, provide qualitative feedback, and assign points to student submissions.
        </p>
      </div>

      <Card className="rounded-2xl border-border bg-card p-12 text-center">
        <ClipboardCheck className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-base font-semibold text-foreground">Queue is empty</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          No student submissions currently require manual grading.
        </p>
      </Card>
    </div>
  );
}
