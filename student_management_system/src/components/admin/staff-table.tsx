"use client";

import { StaffUserItem } from "@/types/staff";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Shield, User, ShieldAlert } from "lucide-react";

interface StaffTableProps {
  staffList: StaffUserItem[];
  currentUserId?: string;
  onEdit: (staff: StaffUserItem) => void;
}

function formatDate(val: Date | string | undefined): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function StaffTable({ staffList, currentUserId, onEdit }: StaffTableProps) {
  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[260px]">Staff Member</TableHead>
            <TableHead className="w-[120px]">Role</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[160px]">Security State</TableHead>
            <TableHead className="w-[140px]">Registered</TableHead>
            <TableHead className="w-[90px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staffList.map((user) => {
            const initials = user.name
              .trim()
              .split(/\s+/)
              .map((p) => p[0] || "")
              .join("")
              .substring(0, 2)
              .toUpperCase();

            const isSelf = user.id === currentUserId;

            return (
              <TableRow key={user.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border shrink-0">
                      <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <span className="font-semibold text-foreground block truncate">
                        {user.name}{" "}
                        {isSelf && (
                          <span className="text-xs text-muted-foreground font-normal">(You)</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground block truncate font-mono">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.role === "ADMIN" ? (
                    <Badge variant="default" className="text-xs gap-1">
                      <Shield className="h-3 w-3" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <User className="h-3 w-3" /> Staff
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.status === "ACTIVE" ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs font-medium gap-1">
                      <ShieldAlert className="h-3 w-3" /> Suspended
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.mustChangePassword ? (
                    <Badge
                      variant="outline"
                      className="text-[11px] text-amber-600 dark:text-amber-400 border-amber-500/30"
                    >
                      First Login Pending
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Normal Active</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(user)}
                    disabled={isSelf}
                    title={
                      isSelf ? "You cannot modify your own account" : "Edit staff role or status"
                    }
                    aria-label={`Edit ${user.name}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
