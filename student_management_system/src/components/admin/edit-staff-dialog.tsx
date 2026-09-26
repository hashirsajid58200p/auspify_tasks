"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api-client";
import { StaffUserItem } from "@/types/staff";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffUser: StaffUserItem | null;
}

function EditStaffContent({
  staffUser,
  onClose,
}: {
  staffUser: StaffUserItem;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [role, setRole] = React.useState<"ADMIN" | "STAFF">(staffUser.role);
  const [status, setStatus] = React.useState<"ACTIVE" | "SUSPENDED">(staffUser.status);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        role,
        status,
      };
      return api.patch<StaffUserItem>(`/api/admin/staff/${staffUser.id}`, payload);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success(`Account for ${updated.name} updated successfully.`);
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update staff member.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const isSuspending = status === "SUSPENDED" && staffUser.status !== "SUSPENDED";

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <DialogHeader>
        <DialogTitle>Modify Staff Account</DialogTitle>
        <DialogDescription>
          Adjust role permissions and account status for <strong>{staffUser.name}</strong> (
          {staffUser.email}).
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="grid gap-1.5">
          <Label htmlFor="editStaffRole">Role Authority</Label>
          <select
            id="editStaffRole"
            value={role}
            onChange={(e) => setRole(e.target.value as "STAFF" | "ADMIN")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="STAFF" className="bg-popover text-popover-foreground">
              Staff Member
            </option>
            <option value="ADMIN" className="bg-popover text-popover-foreground">
              Administrator
            </option>
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="editStaffStatus">Account Status</Label>
          <select
            id="editStaffStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as "ACTIVE" | "SUSPENDED")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ACTIVE" className="bg-popover text-popover-foreground">
              Active (Permitted Access)
            </option>
            <option value="SUSPENDED" className="bg-popover text-popover-foreground">
              Suspended (Blocked)
            </option>
          </select>
        </div>

        {isSuspending && (
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Warning:</strong> Suspending this account will immediately revoke all active
              browser sessions and block any subsequent login attempts.
            </span>
          </div>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditStaffDialog({ open, onOpenChange, staffUser }: EditStaffDialogProps) {
  if (!staffUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden">
        {open && (
          <EditStaffContent
            key={staffUser.id}
            staffUser={staffUser}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
