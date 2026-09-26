"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, Loader2, AlertCircle, CheckCircle2, LogOut } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage("New password must be different from current temporary password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json?.error?.message || "Failed to update password.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch {
      setErrorMessage("Network error: Unable to communicate with server.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  return (
    <Card className="shadow-lg border-border">
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="mx-auto h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold font-display tracking-tight">
          Change Password Required
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Your account was provisioned with a temporary password. Please set a secure personal
          password to continue.
        </CardDescription>
      </CardHeader>

      {success ? (
        <CardContent className="space-y-4 py-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-foreground">Password updated successfully!</p>
          <p className="text-xs text-muted-foreground">Redirecting to your dashboard...</p>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive flex items-center gap-2 border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-xs font-semibold">
                Temporary / Current Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type="password"
                  required
                  placeholder="Current password"
                  className="pl-9 h-10 text-sm"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-semibold">
                New Password (min 8 characters)
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  required
                  placeholder="New secure password"
                  className="pl-9 h-10 text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Repeat new password"
                  className="pl-9 h-10 text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-10 mt-2 font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password & Continue"
              )}
            </Button>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-border/50 pt-4 text-xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
