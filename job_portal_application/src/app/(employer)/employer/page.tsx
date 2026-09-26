import * as React from "react";
import Link from "next/link";
import {
  PlusCircle,
  Building2,
  Briefcase,
  Users,
  Eye,
  ArrowRight,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireServerUser } from "@/server/auth/server-session";
import { getEmployerDashboardData } from "@/server/services/dashboards";

export const dynamic = "force-dynamic";

export default async function EmployerDashboardPage() {
  const user = await requireServerUser(["EMPLOYER"]);
  const { metrics, funnel, jobsNeedingAttention, recentJobs, company } =
    await getEmployerDashboardData(user.userId);

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 md:border-4 border-black bg-[#FFC224] text-black p-6 md:p-10 shadow-neo">
        <div className="relative z-10 max-w-2xl space-y-3">
          <Badge className="bg-black text-white border-2 border-black font-bold uppercase text-[11px]">
            Hiring Console
          </Badge>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="text-black/80 text-sm md:text-base font-semibold leading-relaxed">
            {company
              ? `Manage hiring pipelines for ${company.name}, publish roles, and review candidates.`
              : "Set up your company profile to start posting verified job openings."}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-black text-white hover:bg-neutral-900 border-2 border-black cursor-pointer shadow-neo-sm font-bold"
            >
              <Link href="/employer/jobs/new" className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>Post New Job</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white text-black border-2 border-black cursor-pointer font-bold shadow-neo-sm"
            >
              <Link href="/employer/company" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{company ? "Company Settings" : "Setup Company"}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">Active Jobs</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#06D6A0]/20 text-[#06D6A0] flex items-center justify-center border-2 border-black">
              <Briefcase className="w-5 h-5 text-black" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{metrics.activeJobs}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">Live in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">Applicants</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#2F81F7]/15 text-[#2F81F7] flex items-center justify-center border-2 border-black">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{metrics.totalApplicants}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">Across all jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">Views</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 text-[#6366F1] flex items-center justify-center border-2 border-black">
              <Eye className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{metrics.totalViews}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">Listing impressions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground">Drafts</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#FFD166]/20 flex items-center justify-center border-2 border-black">
              <Briefcase className="w-5 h-5 text-black" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{metrics.draftJobs}</div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">Unpublished jobs</p>
          </CardContent>
        </Card>
      </div>

      {/* Hiring Pipeline Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Hiring Pipeline Funnel</CardTitle>
          <CardDescription>
            Candidate progression across all your published job listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
          </div>
        </CardContent>
      </Card>

      {/* Jobs Needing Attention Alert */}
      {jobsNeedingAttention.length > 0 && (
        <Card className="border-2 border-black bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                <CardTitle className="text-lg">Jobs Needing Attention</CardTitle>
              </div>
              <CardDescription>
                Published roles currently with 0 applicant submissions. Consider updating tags or
                promoting the listing.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jobsNeedingAttention.map((job) => (
                <div
                  key={job._id.toString()}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border-2 border-black bg-white dark:bg-[#191919]"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black">
                      <Link href={`/employer/jobs/${job._id}/edit`} className="hover:underline">
                        {job.title}
                      </Link>
                    </h4>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {job.location} • Published {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-2 border-black font-bold shrink-0 self-start sm:self-center"
                  >
                    <Link href={`/employer/jobs/${job._id}/edit`}>Review Listing</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Listings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Listings</CardTitle>
            <CardDescription>Recently created or updated job opportunities</CardDescription>
          </div>
          {recentJobs.length > 0 && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="font-bold border-2 border-black gap-1"
            >
              <Link href="/employer/jobs">
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No jobs posted yet</h3>
              <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                Create your first job listing to start receiving candidate applications.
              </p>
              <Button asChild size="default" className="font-bold border-2 border-black">
                <Link href="/employer/jobs/new" className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Listing</span>
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job._id.toString()}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 border-black bg-neutral-50 dark:bg-neutral-900/60"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-[10px] font-extrabold border-2 border-black ${
                          job.status === "PUBLISHED"
                            ? "bg-[#06D6A0] text-black"
                            : job.status === "DRAFT"
                              ? "bg-[#FFD166] text-black"
                              : "bg-neutral-200 text-black"
                        }`}
                      >
                        {job.status}
                      </Badge>
                      <h4 className="text-sm font-extrabold hover:text-primary">
                        <Link href={`/employer/jobs/${job._id}/edit`}>{job.title}</Link>
                      </h4>
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground">
                      {job.location} • {job.type.replace("_", " ")} • {job.applicationCount}{" "}
                      Applicants
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button
                      asChild
                      size="sm"
                      className="bg-black text-white hover:bg-neutral-800 border-2 border-black font-bold"
                    >
                      <Link href={`/employer/jobs/${job._id}/applicants`}>
                        Candidates ({job.applicationCount})
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-2 border-black font-bold"
                    >
                      <Link href={`/employer/jobs/${job._id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
