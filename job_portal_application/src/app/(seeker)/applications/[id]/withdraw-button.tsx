"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";

interface WithdrawButtonProps {
  applicationId: string;
}

export function WithdrawButton({ applicationId }: WithdrawButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleWithdraw() {
    setLoading(true);
    try {
      await fetchApi(`/api/applications/${applicationId}/withdraw`, {
        method: "POST",
      });

      toast.success("Application withdrawn.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to withdraw application.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-xl font-bold"
        >
          Withdraw Application
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-6 border-3 border-black rounded-3xl shadow-neo-lg space-y-4">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 border-2 border-red-500 flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <DialogTitle className="text-xl font-black">Withdraw Application?</DialogTitle>
          <DialogDescription className="text-xs font-semibold text-muted-foreground">
            Are you sure you want to withdraw your submission? This moves your application to the
            terminal WITHDRAWN state and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="rounded-xl border-2 border-black font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={loading}
            className="rounded-xl font-black bg-red-600 hover:bg-red-700 text-white border-2 border-black shadow-neo-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            <span>Yes, Withdraw</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
