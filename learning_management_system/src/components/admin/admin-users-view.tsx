"use client";

import * as React from "react";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  Loader2,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  isDemo: boolean;
  createdAt: string | Date;
}

interface AdminUsersViewProps {
  currentAdminId: string;
  initialUsers: AdminUserItem[];
  initialTotal: number;
}

export function AdminUsersView({
  currentAdminId,
  initialUsers,
  initialTotal,
}: AdminUsersViewProps) {
  const [users, setUsers] = React.useState<AdminUserItem[]>(initialUsers);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [isLoading, setIsLoading] = React.useState(false);

  // Role Change Dialog State
  const [roleTargetUser, setRoleTargetUser] = React.useState<AdminUserItem | null>(null);
  const [selectedNewRole, setSelectedNewRole] = React.useState<"STUDENT" | "INSTRUCTOR" | "ADMIN">("STUDENT");
  const [isSubmittingRole, setIsSubmittingRole] = React.useState(false);

  // Status Toggle State
  const [statusTargetUser, setStatusTargetUser] = React.useState<AdminUserItem | null>(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to fetch users");

      setUsers(json.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error fetching users");
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  // Handle role change submit
  const handleRoleChangeSubmit = async () => {
    if (!roleTargetUser) return;
    setIsSubmittingRole(true);

    try {
      const res = await fetch(`/api/admin/users/${roleTargetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedNewRole }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update user role");
      }

      toast.success(`Role for ${roleTargetUser.name} changed to ${selectedNewRole}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === roleTargetUser.id ? { ...u, role: selectedNewRole } : u))
      );
      setRoleTargetUser(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // Handle status toggle submit
  const handleStatusToggleSubmit = async () => {
    if (!statusTargetUser) return;
    const newStatus = statusTargetUser.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setIsSubmittingStatus(true);

    try {
      const res = await fetch(`/api/admin/users/${statusTargetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to change user status");
      }

      toast.success(
        `User ${statusTargetUser.name} is now ${newStatus === "SUSPENDED" ? "suspended (sessions revoked)" : "reactivated"}`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === statusTargetUser.id ? { ...u, status: newStatus } : u))
      );
      setStatusTargetUser(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            User Directory & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage user permissions, adjust roles, and enforce account suspension safeguards.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); }}>
            <SelectTrigger className="w-[140px] h-10 text-xs rounded-xl">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); }}>
            <SelectTrigger className="w-[140px] h-10 text-xs rounded-xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={fetchUsers}
            className="rounded-xl h-10 px-4 text-xs shrink-0"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Filter"}
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <Users className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">No users found</p>
            <p>Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((u) => {
                  const isSelf = u.id === currentAdminId;

                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{u.name}</p>
                          {isSelf && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              You
                            </Badge>
                          )}
                          {u.isDemo && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                              Demo
                            </Badge>
                          )}
                        </div>
                        <p className="text-2xs text-muted-foreground">{u.email}</p>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={u.role === "ADMIN" ? "default" : u.role === "INSTRUCTOR" ? "secondary" : "outline"}
                          className="text-2xs"
                        >
                          {u.role}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        {u.status === "ACTIVE" ? (
                          <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20 text-2xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-2xs">
                            Suspended
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-2xs h-8"
                            disabled={isSelf}
                            onClick={() => {
                              setSelectedNewRole(u.role);
                              setRoleTargetUser(u);
                            }}
                          >
                            Change Role
                          </Button>

                          <Button
                            variant={u.status === "ACTIVE" ? "ghost" : "default"}
                            size="sm"
                            className={`rounded-xl text-2xs h-8 ${
                              u.status === "ACTIVE"
                                ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                            disabled={isSelf}
                            onClick={() => setStatusTargetUser(u)}
                          >
                            {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Role Change Modal */}
      {roleTargetUser && (
        <Dialog open={!!roleTargetUser} onOpenChange={(open) => !open && setRoleTargetUser(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Change User Role</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Updating {roleTargetUser.name}&apos;s role will immediately revoke their active sessions, requiring them to sign in again.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-foreground">Current Account:</span>
                <p className="text-muted-foreground">{roleTargetUser.name} ({roleTargetUser.email})</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Select New Role</label>
                <Select
                  value={selectedNewRole}
                  onValueChange={(val: "STUDENT" | "INSTRUCTOR" | "ADMIN") => setSelectedNewRole(val)}
                >
                  <SelectTrigger className="w-full rounded-xl text-xs">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">STUDENT - Standard learner access</SelectItem>
                    <SelectItem value="INSTRUCTOR">INSTRUCTOR - Course creation & grading</SelectItem>
                    <SelectItem value="ADMIN">ADMIN - Full administrative control</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {roleTargetUser.role === "ADMIN" && selectedNewRole !== "ADMIN" && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Warning: Demoting an administrator is subject to the last-admin protection rule. If this is the only active admin, the request will be rejected.
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setRoleTargetUser(null)}
                disabled={isSubmittingRole}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs"
                onClick={handleRoleChangeSubmit}
                disabled={isSubmittingRole || selectedNewRole === roleTargetUser.role}
              >
                {isSubmittingRole ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Confirm Role Change"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Status Toggle Modal */}
      {statusTargetUser && (
        <Dialog open={!!statusTargetUser} onOpenChange={(open) => !open && setStatusTargetUser(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {statusTargetUser.status === "ACTIVE" ? "Suspend Account" : "Reactivate Account"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {statusTargetUser.status === "ACTIVE"
                  ? "Suspending will terminate all active browser sessions immediately and block sign in."
                  : "Reactivating will restore normal login privileges for this user."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 text-xs space-y-2">
              <p>
                Target account: <span className="font-semibold text-foreground">{statusTargetUser.name}</span> ({statusTargetUser.email})
              </p>
              {statusTargetUser.role === "ADMIN" && statusTargetUser.status === "ACTIVE" && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Safeguard active: You cannot suspend the last active administrator on the platform.
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setStatusTargetUser(null)}
                disabled={isSubmittingStatus}
              >
                Cancel
              </Button>
              <Button
                variant={statusTargetUser.status === "ACTIVE" ? "destructive" : "default"}
                size="sm"
                className="rounded-xl text-xs"
                onClick={handleStatusToggleSubmit}
                disabled={isSubmittingStatus}
              >
                {isSubmittingStatus ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Processing...
                  </>
                ) : statusTargetUser.status === "ACTIVE" ? (
                  "Suspend Account"
                ) : (
                  "Reactivate Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
