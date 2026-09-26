import Link from "next/link";
import { Users, Shield, Tag, History, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireServerUser } from "@/server/auth/server-session";
import { getPlatformStats } from "@/server/services/admin";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireServerUser(["ADMIN"]);
  const stats = await getPlatformStats();

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 md:border-4 border-black bg-[#FF6B7A] text-white p-6 md:p-10 shadow-neo">
        <div className="relative z-10 max-w-2xl space-y-3">
          <Badge className="bg-black text-white border-2 border-black font-bold uppercase text-[11px]">
            Platform Governance
          </Badge>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Administration & Moderation
          </h1>
          <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed">
            Manage user accounts with self-demote and last-admin protections, moderate job postings
            across the network, manage category taxonomies, and inspect immutable audit logs.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-black text-white hover:bg-neutral-900 border-2 border-white shadow-neo-sm font-bold"
            >
              <Link href="/admin/users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Manage Users</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white text-black border-2 border-black shadow-neo-sm font-bold"
            >
              <Link href="/admin/jobs" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Job Moderation</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">Total Users</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center border-2 border-black">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.users.total}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {stats.users.seekers} seekers • {stats.users.employers} employers •{" "}
              {stats.users.admins} admins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">Jobs</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#2F81F7]/15 text-[#2F81F7] flex items-center justify-center border-2 border-black">
              <Shield className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.jobs.total}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {stats.jobs.published} published • {stats.jobs.draft} draft • {stats.jobs.closed}{" "}
              closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">Categories</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#FFC224]/20 text-black flex items-center justify-center border-2 border-black">
              <Tag className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.categories.total}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">Taxonomy sectors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">Audit Logs</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-neutral-200 flex items-center justify-center border-2 border-black">
              <History className="w-5 h-5 text-neutral-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.auditLogs.total}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              Recorded platform events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Safeguards Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#FFC224]" />
            <CardTitle>Administrative Safeguards Active</CardTitle>
          </div>
          <CardDescription>
            System invariants enforced in `src/server/services/admin.ts` and verified in tests:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm font-semibold">
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-black dark:bg-white mt-1.5 flex-shrink-0" />
              <span>
                <strong>Self-Demotion Block:</strong> Administrators cannot alter their own
                administrative role or suspend themselves.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-black dark:bg-white mt-1.5 flex-shrink-0" />
              <span>
                <strong>Last Admin Protection:</strong> The last remaining active administrator
                account cannot be deleted or suspended under any circumstances.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-black dark:bg-white mt-1.5 flex-shrink-0" />
              <span>
                <strong>Session Invalidation:</strong> Changing a user&apos;s role or account status
                automatically invalidates and revokes all active session tokens immediately.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-black dark:bg-white mt-1.5 flex-shrink-0" />
              <span>
                <strong>Taxonomy Integrity:</strong> Categories cannot be deleted while job listings
                are actively associated with them.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
