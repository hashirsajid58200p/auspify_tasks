"use client";

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, KeyRound, User, Lock } from "lucide-react";

interface MeUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF";
  status: "ACTIVE" | "SUSPENDED";
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const { data: user, isLoading } = useQuery<MeUser>({
    queryKey: ["currentUser"],
    queryFn: () => api.get<MeUser>("/api/auth/me"),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }
      return api.post<{ success: boolean; message: string }>("/api/account/password", {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: (data) => {
      toast.success(data.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFieldErrors({});
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update password.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: ["Passwords do not match"] });
      toast.error("New passwords do not match.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal credentials, profile security, and institutional identity.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your institutional credentials and granted authorization level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || !user ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-64" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-md bg-muted/40 border">
                <span className="text-xs text-muted-foreground block">Full Name</span>
                <span className="font-semibold text-foreground text-base mt-0.5 block">
                  {user.name}
                </span>
              </div>

              <div className="p-3 rounded-md bg-muted/40 border">
                <span className="text-xs text-muted-foreground block">Email Address</span>
                <span className="font-mono text-foreground text-sm mt-0.5 block">{user.email}</span>
              </div>

              <div className="p-3 rounded-md bg-muted/40 border flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block">Assigned Role</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{user.role}</span>
                </div>
                {user.role === "ADMIN" ? (
                  <Badge variant="default" className="gap-1 text-xs">
                    <Shield className="h-3 w-3" /> Full Administrator
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Staff Member
                  </Badge>
                )}
              </div>

              <div className="p-3 rounded-md bg-muted/40 border flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block">Account Status</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{user.status}</span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium"
                >
                  Active & Verified
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security: Change Password Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password. All other active sessions will remain protected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="grid gap-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              {fieldErrors.currentPassword && (
                <p className="text-xs text-destructive">{fieldErrors.currentPassword[0]}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="text-[11px] text-muted-foreground">Minimum 8 characters.</p>
              {fieldErrors.newPassword && (
                <p className="text-xs text-destructive">{fieldErrors.newPassword[0]}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-destructive">{fieldErrors.confirmPassword[0]}</p>
              )}
            </div>

            <Button type="submit" disabled={mutation.isPending} className="gap-2">
              <KeyRound className="h-4 w-4" />
              {mutation.isPending ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
