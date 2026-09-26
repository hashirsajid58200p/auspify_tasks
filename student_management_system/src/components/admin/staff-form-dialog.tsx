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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, KeyRound } from "lucide-react";

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateRandomPassword(): string {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < 14; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function StaffFormContent({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState(generateRandomPassword());
  const [role, setRole] = React.useState<"STAFF" | "ADMIN">("STAFF");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  // Credentials handoff state after creation
  const [createdUser, setCreatedUser] = React.useState<{
    name: string;
    email: string;
    tempPass: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      };
      return api.post<StaffUserItem>("/api/admin/staff", payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setCreatedUser({
        name: saved.name,
        email: saved.email,
        tempPass: password,
      });
      toast.success(`Account for ${saved.name} created successfully.`);
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
        toast.error(err.message);
      } else {
        toast.error("Failed to create staff account.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    mutation.mutate();
  };

  const handleCopyCredentials = () => {
    if (!createdUser) return;
    const text = `Student Management System Login\nEmail: ${createdUser.email}\nTemporary Password: ${createdUser.tempPass}\n(You will be required to change your password upon first login)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast.success("Credentials copied to clipboard.");
  };

  if (createdUser) {
    return (
      <div className="p-6 space-y-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <KeyRound className="h-5 w-5" />
            Temporary Credentials Generated
          </DialogTitle>
          <DialogDescription>
            Account for <strong>{createdUser.name}</strong> was created with{" "}
            <code>mustChangePassword: true</code>. Please hand over these credentials directly to
            the staff member.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg border space-y-3 font-mono text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Login Email:</span>
            <span className="font-semibold text-foreground text-sm">{createdUser.email}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Temporary Password:</span>
            <span className="font-bold text-foreground text-sm bg-background px-2 py-1 rounded-sm border inline-block mt-0.5">
              {createdUser.tempPass}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCopyCredentials} className="gap-1.5">
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Credentials"}
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <DialogHeader>
        <DialogTitle>Add Staff Member</DialogTitle>
        <DialogDescription>
          Create an administrative or staff account. The user will be required to set their
          permanent password on initial login.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="grid gap-1.5">
          <Label htmlFor="staffName">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="staffName"
            placeholder="e.g. Eleanor Vance"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="staffEmail">
            Institutional Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="staffEmail"
            type="email"
            placeholder="e.g. e.vance@school.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="staffRole">
              Role Authority <span className="text-destructive">*</span>
            </Label>
            <select
              id="staffRole"
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
            <div className="flex items-center justify-between">
              <Label htmlFor="staffPass">Temp Password</Label>
              <button
                type="button"
                onClick={() => setPassword(generateRandomPassword())}
                className="text-[11px] text-primary hover:underline"
              >
                Regenerate
              </button>
            </div>
            <Input
              id="staffPass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-mono text-xs"
              required
            />
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Account"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function StaffFormDialog({ open, onOpenChange }: StaffFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        {open && <StaffFormContent onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
