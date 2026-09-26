"use client";

import * as React from "react";
import {
  Users,
  Search,
  Shield,
  UserX,
  UserCheck,
  Loader2,
  Filter,
  RefreshCw,
  MoreVertical,
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
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: "JOB_SEEKER" | "EMPLOYER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  isDemo?: boolean;
  createdAt: string;
}

interface UsersManagerProps {
  currentUserId: string;
}

export function UsersManager({ currentUserId }: UsersManagerProps) {
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  // Role change dialog state
  const [selectedUser, setSelectedUser] = React.useState<UserItem | null>(null);
  const [newRole, setNewRole] = React.useState<string>("");
  const [actionLoading, setActionLoading] = React.useState(false);

  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("q", search.trim());
        if (roleFilter) params.set("role", roleFilter);
        if (statusFilter) params.set("status", statusFilter);
        params.set("page", page.toString());
        params.set("limit", "15");

        const res = await fetchApi<{
          data: UserItem[];
          meta: { total: number; totalPages: number; page: number };
        }>(`/api/admin/users?${params.toString()}`);

        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.data || [];
          setUsers(list);
          if (res && "meta" in res && res.meta) {
            setTotalPages(res.meta.totalPages || 1);
            setTotal(res.meta.total || list.length);
          } else {
            setTotal(list.length);
          }
        }
      } catch (err: any) {
        if (isMounted) toast.error(err.message || "Failed to load users");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [search, roleFilter, statusFilter, page, refreshKey]);

  async function handleToggleStatus(user: UserItem) {
    if (user._id === currentUserId) {
      toast.error("Administrators cannot suspend their own account");
      return;
    }

    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setActionLoading(true);
    try {
      await fetchApi(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success(
        `User ${nextStatus === "ACTIVE" ? "reactivated" : "suspended"} successfully. All active sessions invalidated.`,
      );
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRoleChange() {
    if (!selectedUser || !newRole) return;

    if (selectedUser._id === currentUserId && newRole !== "ADMIN") {
      toast.error("Administrators cannot demote their own account");
      return;
    }

    setActionLoading(true);
    try {
      await fetchApi(`/api/admin/users/${selectedUser._id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(
        `User role updated to ${newRole}. User sessions revoked for immediate policy re-evaluation.`,
      );
      setSelectedUser(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge className="bg-[#FF6B7A] text-white border-2 border-black font-bold uppercase text-[11px]">
            User Directory
          </Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Manage Users ({total})
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-semibold">
            Search, moderate permissions, and toggle access states across all accounts.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            setRefreshKey((k) => k + 1);
          }}
          disabled={loading}
          className="border-2 border-black font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 border-2 border-black font-medium"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border-2 border-black font-bold text-xs bg-white dark:bg-[#191919] cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="JOB_SEEKER">Job Seeker</option>
                <option value="EMPLOYER">Employer</option>
                <option value="ADMIN">Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border-2 border-black font-bold text-xs bg-white dark:bg-[#191919] cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground font-semibold flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading user accounts...</span>
        </div>
      ) : (users?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="text-base font-bold">No users match your criteria</h4>
            <p className="text-xs text-muted-foreground">
              Try adjusting your query or filter parameters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border-2 md:border-3 border-black bg-white dark:bg-[#191919] shadow-neo">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-black bg-neutral-100 dark:bg-neutral-800 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {(users || []).map((u) => {
                  const isSelf = u._id === currentUserId;
                  return (
                    <tr key={u._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <td className="p-4">
                        <div className="font-extrabold text-sm">{u.name}</div>
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                          <span>{u.email}</span>
                          {u.isDemo && (
                            <Badge className="bg-[#FFD166] text-black border border-black text-[9px] px-1.5 py-0 font-bold">
                              Demo
                            </Badge>
                          )}
                          {isSelf && (
                            <Badge className="bg-[#06D6A0] text-black border border-black text-[9px] px-1.5 py-0 font-bold">
                              You
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={`border-2 border-black font-bold text-xs ${
                            u.role === "ADMIN"
                              ? "bg-[#FF6B7A] text-white"
                              : u.role === "EMPLOYER"
                                ? "bg-[#FFC224] text-black"
                                : "bg-[#2F81F7]/15 text-[#2F81F7]"
                          }`}
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={`border-2 border-black font-bold text-xs ${
                            u.status === "ACTIVE"
                              ? "bg-[#06D6A0]/20 text-emerald-800 dark:text-emerald-400"
                              : "bg-red-500/20 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs font-semibold text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(u);
                              setNewRole(u.role);
                            }}
                            className="border-2 border-black font-bold text-xs"
                          >
                            Change Role
                          </Button>
                          <Button
                            size="sm"
                            variant={u.status === "ACTIVE" ? "destructive" : "default"}
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf || actionLoading}
                            className="border-2 border-black font-bold text-xs"
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

          {/* Mobile Cards (Rule 10 & PLAN.md: tables collapse into cards on mobile) */}
          <div className="md:hidden space-y-3">
            {(users || []).map((u) => {
              const isSelf = u._id === currentUserId;
              return (
                <div
                  key={u._id}
                  className="p-4 rounded-2xl border-2 border-black bg-white dark:bg-[#191919] shadow-neo space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-sm flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isSelf && (
                          <Badge className="bg-[#06D6A0] text-black border border-black text-[9px] px-1 py-0 font-bold">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold">{u.email}</div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border-2 border-black font-bold text-[10px] ${
                        u.status === "ACTIVE"
                          ? "bg-[#06D6A0]/20 text-emerald-800"
                          : "bg-red-500/20 text-red-700"
                      }`}
                    >
                      {u.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span>Role:</span>
                    <Badge
                      variant="outline"
                      className="border-2 border-black font-bold text-[10px]"
                    >
                      {u.role}
                    </Badge>
                    <span>•</span>
                    <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-black/10">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(u);
                        setNewRole(u.role);
                      }}
                      className="border-2 border-black font-bold text-xs flex-1"
                    >
                      Change Role
                    </Button>
                    <Button
                      size="sm"
                      variant={u.status === "ACTIVE" ? "destructive" : "default"}
                      onClick={() => handleToggleStatus(u)}
                      disabled={isSelf || actionLoading}
                      className="border-2 border-black font-bold text-xs flex-1"
                    >
                      {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-2 border-black font-bold"
              >
                Previous
              </Button>
              <span className="text-xs font-bold text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="border-2 border-black font-bold"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Role Change Modal */}
      <Dialog open={selectedUser !== null} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <DialogContent className="border-3 border-black shadow-neo-lg rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Change User Role</DialogTitle>
            <DialogDescription className="font-semibold text-xs text-muted-foreground">
              Altering a user&apos;s role will immediately revoke all their active sessions and
              record an immutable audit log entry.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl border-2 border-black bg-neutral-50 dark:bg-neutral-900 text-xs font-semibold">
                <div>
                  <strong>User:</strong> {selectedUser.name} ({selectedUser.email})
                </div>
                <div>
                  <strong>Current Role:</strong> {selectedUser.role}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Select New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white dark:bg-[#191919]"
                >
                  <option value="JOB_SEEKER">JOB_SEEKER</option>
                  <option value="EMPLOYER">EMPLOYER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedUser(null)}
              disabled={actionLoading}
              className="border-2 border-black font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={actionLoading || newRole === selectedUser?.role}
              className="border-2 border-black font-bold"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm Role Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
