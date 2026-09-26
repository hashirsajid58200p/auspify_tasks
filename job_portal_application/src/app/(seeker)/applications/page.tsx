import { Metadata } from "next";
import Link from "next/link";
import { FileText, Briefcase, ArrowRight, Clock, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireServerUser } from "@/server/auth/server-session";
import { getSeekerApplications } from "@/server/services/applications";
import { ApplicationStatus } from "@/server/models/application";

export const metadata: Metadata = {
  title: "My Applications | Candidate Portal",
  description: "Track the real-time status of your submitted job applications.",
};

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

export default async function SeekerApplicationsPage() {
  const user = await requireServerUser(["JOB_SEEKER"]);
  const applications = await getSeekerApplications(user.userId);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="space-y-2">
        <Badge className="bg-[#2F81F7] text-white border-2 border-black font-bold uppercase text-[11px]">
          Submissions
        </Badge>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground font-medium text-sm md:text-base max-w-2xl leading-relaxed">
          Track the live status of all submitted roles governed by our auditable state machine.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white dark:bg-[#191919] border-3 border-black rounded-3xl p-10 md:p-14 text-center shadow-neo space-y-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black">No applications submitted yet</h3>
            <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto">
              Ready to find your next position? Explore published openings and apply with your
              profile snapshot.
            </p>
          </div>
          <Button asChild className="rounded-xl font-bold mt-2 shadow-neo-sm">
            <Link href="/jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Browse Job Catalog</span>
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const job = app.jobId;
            const company = job?.companyId;

            return (
              <div
                key={app._id.toString()}
                className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-neo hover:shadow-neo-lg transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase text-muted-foreground">
                      {company?.name || "Company"}
                    </span>
                    <span>•</span>
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    {getStatusBadge(app.status)}
                  </div>

                  <Link href={`/applications/${app._id.toString()}`}>
                    <h3 className="text-lg md:text-xl font-black text-neutral-900 dark:text-neutral-100 hover:text-[#2F81F7] transition-colors leading-tight truncate">
                      {job?.title || "Job Listing"}
                    </h3>
                  </Link>

                  <p className="text-xs text-muted-foreground font-medium truncate">
                    {job?.location} • {job?.type?.replace("_", " ")}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-black/10">
                  <Button
                    asChild
                    className="rounded-xl font-bold flex-1 md:flex-none shadow-neo-sm"
                  >
                    <Link href={`/applications/${app._id.toString()}`}>
                      <span>View Status Tracker</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
