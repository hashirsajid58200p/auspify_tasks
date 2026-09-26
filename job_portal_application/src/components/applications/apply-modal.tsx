"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";

interface ApplyModalProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
}

export function ApplyModal({ jobId, jobTitle, companyName }: ApplyModalProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [coverLetter, setCoverLetter] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await fetchApi(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        body: JSON.stringify({
          coverLetter: coverLetter.trim(),
        }),
      });

      setSuccess(true);
      toast.success("Application submitted successfully!");
      router.refresh();
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          setError("You must be logged in as a Job Seeker to apply.");
        } else if (err.status === 409) {
          setError("You have already submitted an application for this position.");
        } else {
          setError(err.message || "Failed to submit application.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setOpen(false);
    setError(null);
    setSuccess(false);
    setCoverLetter("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl font-black text-base px-8 py-6 shadow-neo-sm bg-[#FFE500] hover:bg-[#FFD600] text-black border-2 border-black">
          Apply Now
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg p-6 border-3 border-black rounded-3xl shadow-neo-lg">
        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl border-2 border-black bg-[#10B981] text-white mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black">Application Submitted!</h3>
              <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto">
                Your profile snapshot and cover letter were securely delivered to {companyName}.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1 rounded-xl font-bold">
                <Link href="/applications">View My Applications</Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="rounded-xl font-bold border-2 border-black"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Apply for {jobTitle}</DialogTitle>
              <DialogDescription className="text-xs font-semibold text-muted-foreground">
                Hiring organization:{" "}
                <span className="font-bold text-foreground">{companyName}</span>
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border-2 border-red-500 rounded-xl flex items-start gap-2 text-xs font-bold text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Immutability Snapshot Notice */}
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 border-2 border-black rounded-2xl flex items-start gap-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-[#2F81F7] shrink-0 mt-0.5" />
              <span>
                A permanent snapshot of your current seeker profile (headline, skills, experience,
                and links) will be captured. Future profile edits will not alter this submission.
              </span>
            </div>

            {/* Cover Letter Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Cover Letter (Optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="Share relevant projects, why you're interested in this role, or specific questions for the team..."
                className="w-full p-3 rounded-xl border-2 border-black bg-background text-sm font-medium focus:outline-hidden resize-y min-h-[120px]"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
                <span>Plain text only</span>
                <span>{coverLetter.length}/2000</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-xl border-2 border-black font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl font-black bg-[#2F81F7] hover:bg-[#256cd1] text-white border-2 border-black flex items-center gap-1.5 shadow-neo-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
