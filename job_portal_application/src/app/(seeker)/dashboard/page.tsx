import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  FileText,
  Bookmark,
  Search,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireServerUser } from "@/server/auth/server-session";
import { getSeekerDashboardData } from "@/server/services/dashboards";
import { ApplicationStatus } from "@/server/models/application";

export const dynamic = "force-dynamic";

function getStatusBadge(status: ApplicationStatus) {
  switch (status) {
    case "SUBMITTED":
      return (
        <Badge
          variant="outline"
          className="border-2 border-black font-extrabold text-xs bg-neutral-100 dark:bg-neutral-800"
        >
          Submitted
        </Badge>
      );
    case "UNDER_REVIEW":
      return (
        <Badge
          variant="outline"
          className="border-2 border-black font-extrabold text-xs bg-[#2F81F7]/15 text-[#2F81F7]"
        >
          Under Review
        </Badge>
      );
    case "SHORTLISTED":
      return (
        <Badge
          variant="outline"
          className="border-2 border-black font-extrabold text-xs bg-[#FFE500] text-black"
        >
          Shortlisted
        </Badge>
      );
    case "INTERVIEW":
      return (
        <Badge
          variant="outline"
          className="border-2 border-black font-extrabold text-xs bg-[#6366F1]/15 text-[#6366F1]"
        >
          Interviewing
        </Badge>
      );
    case "OFFERED":
      return (
        <Badge
          variant="outline"
          className="border-2 border-black font-extrabold text-xs bg-[#10B981] text-white"
        >
          Offer Extended
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="border-2 border-red-500 font-extrabold text-xs bg-red-50 text-red-600 dark:bg-red-950/20"
        >
          Not Selected
        </Badge>
      );
    case "WITHDRAWN":
      return (
        <Badge
          variant="outline"
          className="border-2 border-black/40 font-extrabold text-xs text-muted-foreground"
        >
          Withdrawn
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

export default async function SeekerDashboardPage() {
  const user = await requireServerUser(["JOB_SEEKER"]);
  const { metrics, funnel, recentApplications, recentSavedJobs } = await getSeekerDashboardData(
    user.userId,
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 md:border-4 border-black bg-[#2F81F7] text-white p-6 md:p-10 shadow-neo">
        <div className="relative z-10 max-w-2xl space-y-3">
          <Badge className="bg-white text-black border-2 border-black font-bold uppercase text-[11px]">
            Candidate Portal
          </Badge>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed">
            Search verified listings, manage your immutable profile snapshots, and monitor your
            hiring progress across all employers in real-time.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-black text-white hover:bg-neutral-900 border-2 border-white shadow-neo-sm font-bold"
            >
              <Link href="/jobs" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>Search Jobs</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white text-black border-2 border-black font-bold shadow-neo-sm"
            >
              <Link href="/profile">Edit Profile</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">
              Applications
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#2F81F7]/10 text-[#2F81F7] flex items-center justify-center border-2 border-black">
              <FileText className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{metrics.totalApplications}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              Submitted applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">
              Active Reviews
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#FFC224]/20 text-black flex items-center justify-center border-2 border-black">
              <Briefcase className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{metrics.activeReviews}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              In review or interview
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">
              Offers Extended
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center border-2 border-black">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{metrics.offersCount}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              Awaiting your decision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">Saved Jobs</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#FF6B7A]/20 text-[#FF6B7A] flex items-center justify-center border-2 border-black">
              <Bookmark className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{metrics.savedJobsCount}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              Bookmarked opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Application Status Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Application Pipeline Funnel</CardTitle>
          <CardDescription>
            Live status breakdown of all your candidate applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3 rounded-2xl border-2 border-black bg-neutral-50 dark:bg-neutral-900/50 text-center space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                Submitted
              </span>
              <div className="text-2xl font-black">{funnel.submitted}</div>
            </div>
            <div className="p-3 rounded-2xl border-2 border-black bg-[#2F81F7]/10 text-center space-y-1">
              <span className="text-[11px] font-bold text-[#2F81F7] uppercase">Under Review</span>
              <div className="text-2xl font-black">{funnel.underReview}</div>
            </div>
            <div className="p-3 rounded-2xl border-2 border-black bg-[#FFE500]/20 text-center space-y-1">
              <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase">
                Shortlisted
              </span>
              <div className="text-2xl font-black">{funnel.shortlisted}</div>
            </div>
            <div className="p-3 rounded-2xl border-2 border-black bg-[#6366F1]/10 text-center space-y-1">
              <span className="text-[11px] font-bold text-[#6366F1] uppercase">Interview</span>
              <div className="text-2xl font-black">{funnel.interview}</div>
            </div>
            <div className="p-3 rounded-2xl border-2 border-black bg-[#10B981]/15 text-center space-y-1">
              <span className="text-[11px] font-bold text-[#10B981] uppercase">Offered</span>
              <div className="text-2xl font-black">{funnel.offered}</div>
            </div>
            <div className="p-3 rounded-2xl border-2 border-black bg-red-500/10 text-center space-y-1">
              <span className="text-[11px] font-bold text-red-600 uppercase">Rejected</span>
              <div className="text-2xl font-black">{funnel.rejected}</div>
            </div>
            <div className="p-3 rounded-2xl border-2 border-black bg-neutral-200/50 dark:bg-neutral-800 text-center space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                Withdrawn
              </span>
              <div className="text-2xl font-black">{funnel.withdrawn}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Recent Applications & Saved Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Track status changes in real time</CardDescription>
            </div>
            {recentApplications.length > 0 && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="font-bold border-2 border-black gap-1"
              >
                <Link href="/applications">
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-bold">No applications submitted</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Browse jobs in our catalog and apply with your profile.
                </p>
                <Button asChild size="sm" className="font-bold border-2 border-black">
                  <Link href="/jobs">Browse Jobs</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app) => {
                  const job = app.jobId;
                  const company = job?.companyId;

                  return (
                    <div
                      key={app._id.toString()}
                      className="p-3.5 rounded-2xl border-2 border-black bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-muted-foreground truncate max-w-[140px]">
                            {company?.name || "Company"}
                          </span>
                          <span>•</span>
                          {getStatusBadge(app.status)}
                        </div>
                        <h4 className="text-sm font-black truncate hover:text-[#2F81F7]">
                          <Link href={`/applications/${app._id.toString()}`}>
                            {job?.title || "Job Listing"}
                          </Link>
                        </h4>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-2 border-black font-bold shrink-0"
                      >
                        <Link href={`/applications/${app._id.toString()}`}>Track</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Jobs Shortcut */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Saved Jobs</CardTitle>
              <CardDescription>Quick access to bookmarked roles</CardDescription>
            </div>
            {recentSavedJobs.length > 0 && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="font-bold border-2 border-black gap-1"
              >
                <Link href="/saved-jobs">
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {recentSavedJobs.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
                  <Bookmark className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-bold">No saved jobs yet</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Click the bookmark icon on any job card to save it for later.
                </p>
                <Button asChild size="sm" className="font-bold border-2 border-black">
                  <Link href="/jobs">Explore Openings</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSavedJobs.map((sj) => {
                  const job = sj.jobId;
                  const company = job?.companyId;

                  return (
                    <div
                      key={sj._id.toString()}
                      className="p-3.5 rounded-2xl border-2 border-black bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <span className="text-xs font-bold text-muted-foreground truncate block">
                          {company?.name || "Company"}
                        </span>
                        <h4 className="text-sm font-black truncate hover:text-[#2F81F7]">
                          <Link href={`/jobs/${job?.slug}`}>{job?.title || "Job Listing"}</Link>
                        </h4>
                        <div className="text-xs font-semibold text-muted-foreground">
                          {job?.location} • {job?.type?.replace("_", " ")}
                        </div>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        className="border-2 border-black font-bold shrink-0 bg-black text-white"
                      >
                        <Link href={`/jobs/${job?.slug}`}>Apply</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
