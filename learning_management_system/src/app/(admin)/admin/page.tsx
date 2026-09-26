import { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  BookOpen,
  UserCheck,
  ShieldAlert,
  Award,
  ArrowRight,
  ShieldCheck,
  FolderTree,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireServerUser } from "@/server/auth/server-session";
import { getPlatformStats } from "@/server/services/admin";

export const metadata: Metadata = {
  title: "Admin Command Center | EduFlow LMS",
  description: "Platform administration overview, security metrics, and course moderation.",
};

export default async function AdminOverviewPage() {
  await requireServerUser(["ADMIN"]);
  const stats = await getPlatformStats();

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Platform Administration
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Global metrics, administrative user access, course moderation, and system audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="rounded-xl text-xs" asChild>
            <Link href="/admin/users">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Manage Users
            </Link>
          </Button>
          <Button size="sm" className="rounded-xl text-xs shadow-xs" asChild>
            <Link href="/admin/audit-logs">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
              Audit Ledger
            </Link>
          </Button>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-5 rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Users
            </span>
            <Users className="w-4 h-4" />
          </div>
          <div className="mt-3 text-3xl font-extrabold">{stats.users.total}</div>
          <p className="mt-1 text-2xs opacity-80">
            {stats.users.students} students • {stats.users.instructors} instructors • {stats.users.admins} admins
          </p>
        </Card>

        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Courses
            </span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">{stats.courses.total}</div>
          <p className="mt-1 text-2xs text-muted-foreground">
            {stats.courses.published} published • {stats.courses.draft} draft
          </p>
        </Card>

        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Enrollments
            </span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">{stats.enrollments.total}</div>
          <p className="mt-1 text-2xs text-muted-foreground">
            {stats.enrollments.completed} completed (100%)
          </p>
        </Card>

        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Certificates
            </span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">{stats.certificates.total}</div>
          <p className="mt-1 text-2xs text-muted-foreground">Issued credentials</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Audit Events
            </span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">{stats.auditLogs.total}</div>
          <p className="mt-1 text-2xs text-muted-foreground">Recorded immutable logs</p>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-border bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-foreground">User Management</h2>
            <p className="text-xs text-muted-foreground">
              Search accounts, modify role permissions (`STUDENT`, `INSTRUCTOR`, `ADMIN`), and toggle suspension status with safeguard protections.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-xs w-full" asChild>
            <Link href="/admin/users">
              Open User Directory
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-foreground">Course Moderation</h2>
            <p className="text-xs text-muted-foreground">
              Review instructor curriculum, enforce content publishing standards, and moderate live vs archived courses.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-xs w-full" asChild>
            <Link href="/admin/courses">
              Open Moderation Queue
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-foreground">Category Taxonomy</h2>
            <p className="text-xs text-muted-foreground">
              Organize educational topics, add new domains, and prevent orphaned course references with strict deletion guards.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-xs w-full" asChild>
            <Link href="/admin/categories">
              Manage Categories
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
