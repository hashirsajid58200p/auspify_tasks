"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useAccount,
  useUpdateProfile,
  useChangePassword,
  useDeleteAccount,
  useSessions,
  useRevokeSession,
  useLogoutAll,
} from "@/hooks/use-account";
import { ALLOWED_CURRENCIES } from "@/validations/account";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  ShieldCheck,
  Smartphone,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Laptop,
  LogOut,
  Info,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { data: user, isLoading: isUserLoading } = useAccount();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();

  const { data: sessions = [], isLoading: isSessionsLoading } = useSessions();
  const revokeSessionMutation = useRevokeSession();
  const logoutAllMutation = useLogoutAll();

  // Profile Form state
  const [name, setName] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [isProfileInitialized, setIsProfileInitialized] = React.useState(false);

  // Sync profile when loaded
  if (user && !isProfileInitialized) {
    setName(user.name);
    setCurrency(user.currency || "USD");
    setIsProfileInitialized(true);
  }

  // Password Form state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  // Delete Account Modal state
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState("");
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        name,
        currency,
      });
      toast.success("Profile preferences saved successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 10) {
      setPasswordError("New password must be at least 10 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success(
        "Password changed successfully. Other active sessions have been revoked."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      setPasswordError(msg);
      toast.error(msg);
    }
  };

  const handleExportJson = () => {
    const link = document.createElement("a");
    link.href = "/api/account/export";
    link.setAttribute(
      "download",
      `expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Account backup JSON downloaded");
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSessionMutation.mutateAsync(sessionId);
      toast.success("Device session revoked");
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAllMutation.mutateAsync();
      toast.success("All other active device sessions revoked");
    } catch {
      toast.error("Failed to sign out all sessions");
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (deleteConfirmation !== "DELETE") {
      setDeleteError('Please type "DELETE" exactly to confirm');
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync({
        password: deletePassword,
        confirmation: "DELETE",
      });
      toast.success("Account deleted permanently");
      setDeleteModalOpen(false);
      router.push("/register");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account";
      setDeleteError(msg);
      toast.error(msg);
    }
  };

  const isDemo = Boolean(user?.isDemo);

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border border-border/80 bg-card/60 shadow-xs">
        <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
          Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Manage your personal profile, preferred currency, security credentials,
          and data privacy.
        </p>
      </div>

      {/* Demo Account Callout */}
      {isDemo && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-semibold">Demo Account Restrictions Active</h4>
            <p className="text-muted-foreground leading-relaxed">
              You are logged in as the official evaluation account (
              <span className="font-mono font-medium">{user?.email}</span>).
              Password changes and account deletion are disabled so evaluators
              can test the environment uninterrupted. You may update display
              name, currency, and test JSON export.
            </p>
          </div>
        </div>
      )}

      {/* 1. Profile & Regional Currency Card */}
      <Card className="shadow-xs border-border/80">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <User className="size-3.5" />
            </div>
            <CardTitle className="text-base font-semibold">
              Profile & Regional Currency
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Personal identity and primary currency formatting applied across all
            ledgers and charts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="h-10 text-sm bg-muted/50 cursor-not-allowed text-muted-foreground"
                />
                <p className="text-[11px] text-muted-foreground">
                  Email is permanent for security isolation.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="h-10 text-sm"
                  disabled={isUserLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-xs font-medium">
                  Primary Currency
                </Label>
                <Select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {ALLOWED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Used by <span className="font-mono">formatMoney()</span> on
                  KPIs, transactions, and reports.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={updateProfileMutation.isPending || isUserLoading}
                className="text-xs font-medium h-9"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Security & Password Card */}
      <Card className="shadow-xs border-border/80">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="size-3.5" />
            </div>
            <CardTitle className="text-base font-semibold">
              Security & Password
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Hashed with argon2id. Changing your password immediately revokes all
            other active browser sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                {passwordError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-pass" className="text-xs font-medium">
                  Current Password
                </Label>
                <Input
                  id="current-pass"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isDemo || changePasswordMutation.isPending}
                  required
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-pass" className="text-xs font-medium">
                  New Password
                </Label>
                <Input
                  id="new-pass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 10 characters"
                  disabled={isDemo || changePasswordMutation.isPending}
                  required
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-pass" className="text-xs font-medium">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={isDemo || changePasswordMutation.isPending}
                  required
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={isDemo || changePasswordMutation.isPending}
                className="text-xs font-medium h-9"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Updating...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Signed-in Devices / Session Management */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Smartphone className="size-3.5" />
              </div>
              <CardTitle className="text-base font-semibold">
                Signed-in Devices & Sessions
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Active refresh token families across your browser sessions.
            </CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutAll}
              disabled={logoutAllMutation.isPending}
              className="text-xs h-8 text-destructive hover:bg-destructive/10 border-destructive/20 gap-1.5 self-start sm:self-auto"
            >
              <LogOut className="w-3 h-3" />
              Sign Out Other Devices
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isSessionsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-muted/30 border border-border/40 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card/60 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                      <Laptop className="size-4 text-foreground/80" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {s.userAgent.slice(0, 45)}...
                        </span>
                        {s.isCurrent && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          >
                            Current Device
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Last active:{" "}
                        {new Date(s.lastUsedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {!s.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(s.id)}
                      disabled={revokeSessionMutation.isPending}
                      className="text-xs h-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Data Privacy & JSON Export */}
      <Card className="shadow-xs border-border/80">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Download className="size-3.5" />
            </div>
            <CardTitle className="text-base font-semibold">
              Data Portability & Export
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Download a complete portable JSON archive of your account profile,
            categories, transactions, and budget targets.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground max-w-md">
            Full compliance with GDPR & data portability standards. File is
            structured in valid UTF-8 JSON format.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="text-xs h-9 gap-1.5 font-medium shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data (JSON)
          </Button>
        </CardContent>
      </Card>

      {/* 5. Danger Zone / Account Deletion */}
      <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-destructive/10 text-destructive flex items-center justify-center">
              <Trash2 className="size-3.5" />
            </div>
            <CardTitle className="text-base font-semibold text-destructive">
              Danger Zone
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-destructive/80">
            Irreversible actions that permanently destroy your account and all
            stored financial records.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5 max-w-md">
            <h4 className="text-xs font-semibold text-foreground">
              Delete Account & All Financial Records
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Once initiated, all your transactions, custom categories, budget
              caps, and active sessions will be permanently purged from the
              database. This cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            disabled={isDemo}
            className="text-xs h-9 font-medium shrink-0"
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account Modal Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-normal text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Permanently Delete Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This action is permanent and cannot be reversed. Please authenticate
              with your current password to proceed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeleteAccount} className="space-y-4 pt-2">
            {deleteError && (
              <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                {deleteError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="del-pass" className="text-xs font-medium">
                Current Password
              </Label>
              <Input
                id="del-pass"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password"
                required
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="del-confirm" className="text-xs font-medium">
                Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
              </Label>
              <Input
                id="del-confirm"
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                required
                className="h-10 text-sm font-mono"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
                className="text-xs h-8"
                disabled={deleteAccountMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                className="text-xs h-8"
                disabled={
                  deleteAccountMutation.isPending ||
                  deleteConfirmation !== "DELETE" ||
                  !deletePassword
                }
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Deleting...
                  </>
                ) : (
                  "Permanently Purge Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
