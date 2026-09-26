"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { StaffUserItem } from "@/types/staff";
import { StaffTable } from "@/components/admin/staff-table";
import { StaffFormDialog } from "@/components/admin/staff-form-dialog";
import { EditStaffDialog } from "@/components/admin/edit-staff-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, UserPlus, Shield, Users, AlertCircle, RefreshCw, UserX } from "lucide-react";

export default function StaffPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<StaffUserItem | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const {
    data: staffList = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<StaffUserItem[]>({
    queryKey: ["staff"],
    queryFn: () => api.get<StaffUserItem[]>("/api/admin/staff"),
  });

  const { data: currentUser } = useQuery<{ id: string }>({
    queryKey: ["currentUser"],
    queryFn: () => api.get<{ id: string }>("/api/auth/me"),
  });

  const stats = React.useMemo(() => {
    const total = staffList.length;
    const admins = staffList.filter((s) => s.role === "ADMIN").length;
    const regularStaff = staffList.filter((s) => s.role === "STAFF").length;
    const suspended = staffList.filter((s) => s.status === "SUSPENDED").length;
    return { total, admins, regularStaff, suspended };
  }, [staffList]);

  const handleOpenEdit = (staff: StaffUserItem) => {
    setEditingStaff(staff);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
            Staff Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administer institutional faculty accounts, roles, and security access controls.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="self-start sm:self-auto shrink-0">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Accounts
              </p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight">{stats.total}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Administrators
              </p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight">{stats.admins}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Standard Staff
              </p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight">{stats.regularStaff}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Suspended
              </p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight text-destructive">
                {stats.suspended}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <UserX className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Failed to load staff accounts</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "An error occurred while fetching staff records."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table View */}
      {!isLoading && !isError && (
        <StaffTable staffList={staffList} currentUserId={currentUser?.id} onEdit={handleOpenEdit} />
      )}

      {/* Modals */}
      <StaffFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
      <EditStaffDialog open={isEditOpen} onOpenChange={setIsEditOpen} staffUser={editingStaff} />
    </div>
  );
}
