"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Shield,
  Smartphone,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  User,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/formatters";

interface SettingsViewProps {
  initialUser: {
    userId: string;
    email: string;
    name: string;
    role: string;
    status: string;
    isDemo: boolean;
  };
}

interface DeviceSession {
  id: string;
  jti: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
}

export function SettingsView({ initialUser }: SettingsViewProps) {
  const router = useRouter();

  // Name update state
  const [name, setName] = React.useState(initialUser.name);
  const [nameLoading, setNameLoading] = React.useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pwdLoading, setPwdLoading] = React.useState(false);
  const [pwdError, setPwdError] = React.useState<string | null>(null);

  // Active sessions state
  const [sessions, setSessions] = React.useState<DeviceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = React.useState(false);
  const [revokingAll, setRevokingAll] = React.useState(false);

  // Account deletion state
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState("");
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [sessionsKey, setSessionsKey] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetchApi<any>("/api/auth/sessions");
        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.data || [];
          setSessions(list);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setSessionsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [sessionsKey]);

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setNameLoading(true);
    try {
      await fetchApi("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      toast.success("Profile name updated successfully");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile name");
    } finally {
      setNameLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(null);

    if (newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match");
      return;
    }

    setPwdLoading(true);
    try {
      await fetchApi("/api/account/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      toast.success("Password changed! Please log in again with your new credentials.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.push("/login");
    } catch (err: any) {
      setPwdError(err.message || "Failed to change password");
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleRevokeSession(jti: string) {
    try {
      await fetchApi(`/api/auth/sessions?jti=${encodeURIComponent(jti)}`, {
        method: "DELETE",
      });
      toast.success("Session revoked");
      setSessionsKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke session");
    }
  }

  async function handleRevokeAllOtherSessions() {
    setRevokingAll(true);
    try {
      await fetchApi("/api/auth/sessions", {
        method: "DELETE",
      });
      toast.success("All other active sessions have been terminated");
      setSessionsKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out other devices");
    } finally {
      setRevokingAll(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await fetchApi("/api/account", {
        method: "DELETE",
        body: JSON.stringify({ password: deletePassword }),
      });
      toast.success("Your account has been permanently deleted");
      router.push("/login");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account");
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Badge className="bg-black text-white border-2 border-black font-bold uppercase text-[11px]">
          Preferences & Security
        </Badge>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground font-medium text-sm md:text-base max-w-2xl leading-relaxed">
          Manage your credentials, active device sessions, and account lifecycle safeguards.
        </p>
      </div>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-neutral-700" />
            <CardTitle>Account Details</CardTitle>
          </div>
          <CardDescription>Update your personal account display information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateName} className="space-y-4 max-w-md">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-2 border-black font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Email Address
              </label>
              <Input
                value={initialUser.email}
                disabled
                className="border-2 border-neutral-300 bg-neutral-100 dark:bg-neutral-800 text-muted-foreground font-medium"
              />
              <div className="text-xs text-muted-foreground mt-1 font-semibold flex items-center">
                Account role:{" "}
                <Badge variant="outline" className="border-black font-bold text-[10px] ml-1">
                  {initialUser.role}
                </Badge>
              </div>
            </div>

            <Button
              type="submit"
              disabled={nameLoading || name.trim() === initialUser.name}
              className="border-2 border-black font-bold shadow-neo-sm"
            >
              {nameLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#2F81F7]" />
            <CardTitle>Security & Password</CardTitle>
          </div>
          <CardDescription>
            Change your password using Argon2id encryption. This will sign out all your active
            sessions across all devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pwdError && (
            <div className="mb-4 p-3 rounded-xl border-2 border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Current Password
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border-2 border-black font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                New Password (minimum 8 characters)
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border-2 border-black font-medium"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-2 border-black font-medium"
                minLength={8}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={pwdLoading}
              className="border-2 border-black font-bold shadow-neo-sm"
            >
              {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Device Sessions */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#FFC224]" />
              <CardTitle>Active Devices & Sessions</CardTitle>
            </div>
            <CardDescription>
              Monitor signed-in devices using rotating refresh tokens with reuse protection.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSessionsLoading(true);
                setSessionsKey((k) => k + 1);
              }}
              disabled={sessionsLoading}
              className="border-2 border-black font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${sessionsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {(sessions?.length ?? 0) > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeAllOtherSessions}
                disabled={revokingAll}
                className="border-2 border-black font-bold text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {revokingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                )}
                Sign Out Other Devices
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessionsLoading && (sessions?.length ?? 0) === 0 ? (
            <div className="py-6 text-center text-muted-foreground font-semibold text-sm">
              Loading active sessions...
            </div>
          ) : (sessions?.length ?? 0) === 0 ? (
            <div className="py-6 text-center text-muted-foreground font-semibold text-sm">
              No active sessions recorded
            </div>
          ) : (
            <div className="space-y-3">
              {(sessions || []).map((sess, idx) => (
                <div
                  key={sess.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border-2 border-black bg-neutral-50 dark:bg-neutral-900/60"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-bold truncate max-w-sm">{sess.userAgent}</span>
                      {idx === 0 && (
                        <Badge className="bg-[#06D6A0] text-black border-2 border-black text-[10px] font-extrabold">
                          Current Device
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold">
                      Last active: {formatRelativeTime(sess.lastUsedAt)} • Created:{" "}
                      {new Date(sess.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {idx !== 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(sess.jti)}
                      className="border-2 border-black font-bold self-start sm:self-center text-xs"
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

      {/* Danger Zone */}
      <Card className="border-2 border-red-500 bg-red-50/30 dark:bg-red-950/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account and all associated personal data. This action cannot be
            undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border-2 border-red-300 dark:border-red-900 bg-white dark:bg-[#191919]">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-red-600">Delete Account Permanently</h4>
              <p className="text-xs text-muted-foreground font-medium max-w-md">
                {initialUser.role === "EMPLOYER"
                  ? "Note: Employers with active published listings must archive or close all jobs before deleting their account."
                  : "All profile snapshots, saved jobs, and submitted applications will be permanently wiped."}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              className="border-2 border-black font-bold shadow-neo-sm shrink-0"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-3 border-black shadow-neo-lg rounded-3xl max-w-md">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl border-2 border-black bg-red-100 text-red-600 flex items-center justify-center mb-1">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black">Confirm Account Deletion</DialogTitle>
            <DialogDescription className="font-semibold text-xs leading-relaxed text-muted-foreground">
              Are you sure you want to permanently delete your account? This action is irreversible
              and all your data will be permanently wiped from our database.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 rounded-xl border-2 border-red-500 bg-red-50 text-red-700 text-xs font-bold">
              {deleteError}
            </div>
          )}

          <div className="space-y-2 py-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="Enter your account password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="border-2 border-black font-medium"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteLoading}
              className="border-2 border-black font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="border-2 border-black font-bold"
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm & Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
