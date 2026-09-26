"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Lock,
  Smartphone,
  ShieldAlert,
  Loader2,
  CheckCircle,
  AlertCircle,
  LogOut,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface SettingsViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    bio?: string;
  };
  initialSessions: Array<{
    id: string;
    userAgent: string;
    lastUsedAt: string | Date;
    createdAt: string | Date;
  }>;
}

export function SettingsView({ user, initialSessions }: SettingsViewProps) {
  const router = useRouter();

  // Profile State
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState(initialSessions);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // 1. Update Profile Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // 2. Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 3. Revoke Single Session Handler
  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      const res = await fetch(`/api/me/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Failed to revoke session");
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Device session revoked");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke session");
    } finally {
      setRevokingSessionId(null);
    }
  };

  // 4. Logout All Sessions Handler
  const handleLogoutAll = async () => {
    if (!confirm("Are you sure you want to sign out from all devices? You will need to log back in.")) {
      return;
    }

    setIsLoggingOutAll(true);
    try {
      const res = await fetch("/api/auth/logout-all", {
        method: "POST",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Failed to sign out of all sessions");
      }

      toast.success("Signed out of all devices");
      router.push("/login");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to sign out");
      setIsLoggingOutAll(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-border/60">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Manage your personal details, credentials, and active device sessions.
        </p>
      </div>

      {/* 1. Profile Section */}
      <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Profile Information</h2>
            <p className="text-xs text-muted-foreground">Your public name and profile bio.</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                {getInitials(name || user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{name || user.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-2xs font-mono">
                  {user.role}
                </Badge>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl h-10 text-xs sm:text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="rounded-xl h-10 text-xs sm:text-sm bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-xs font-medium">Profile Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others a little about your learning goals or professional background..."
              className="rounded-xl text-xs sm:text-sm min-h-[90px]"
              maxLength={500}
            />
            <p className="text-2xs text-muted-foreground text-right">{bio.length}/500</p>
          </div>

          <Button type="submit" size="sm" className="rounded-xl px-5" disabled={isUpdatingProfile}>
            {isUpdatingProfile ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile Changes"
            )}
          </Button>
        </form>
      </Card>

      {/* 2. Password / Security Section */}
      <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Password & Security</h2>
            <p className="text-xs text-muted-foreground">Keep your account secure with a strong password.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="current-pass" className="text-xs font-medium">Current Password</Label>
            <Input
              id="current-pass"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="rounded-xl h-10 text-xs sm:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-pass" className="text-xs font-medium">New Password</Label>
              <Input
                id="new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="rounded-xl h-10 text-xs sm:text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pass" className="text-xs font-medium">Confirm New Password</Label>
              <Input
                id="confirm-pass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl h-10 text-xs sm:text-sm"
                required
              />
            </div>
          </div>

          <Button type="submit" size="sm" className="rounded-xl px-5 mt-2" disabled={isChangingPassword}>
            {isChangingPassword ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Updating Password...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </Card>

      {/* 3. Active Device Sessions Section */}
      <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Active Sessions & Devices</h2>
              <p className="text-xs text-muted-foreground">Devices currently authorized to access your account.</p>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="rounded-xl text-xs"
            onClick={handleLogoutAll}
            disabled={isLoggingOutAll}
          >
            {isLoggingOutAll ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
            )}
            Sign Out Everywhere
          </Button>
        </div>

        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">No active device sessions found.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {s.userAgent}
                    </span>
                    <Badge variant="outline" className="text-2xs text-emerald-600 border-emerald-600/30">
                      Active
                    </Badge>
                  </div>
                  <p className="text-2xs text-muted-foreground">
                    Last active: {new Date(s.lastUsedAt).toLocaleString()}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-2xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive self-start sm:self-auto"
                  onClick={() => handleRevokeSession(s.id)}
                  disabled={revokingSessionId === s.id}
                >
                  {revokingSessionId === s.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Revoke Device"
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
