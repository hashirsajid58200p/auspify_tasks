import { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Briefcase, ArrowRight, MapPin, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireServerUser } from "@/server/auth/server-session";
import { getSavedJobs } from "@/server/services/saved-jobs";
import { formatSalary, formatJobType, formatLocationType } from "@/lib/formatters";
import { SaveButton } from "@/components/applications/save-button";

export const metadata: Metadata = {
  title: "Saved Jobs | Candidate Portal",
  description: "View and manage your bookmarked job opportunities.",
};

export const dynamic = "force-dynamic";

export default async function SavedJobsPage() {
  const user = await requireServerUser(["JOB_SEEKER"]);
  const savedList = await getSavedJobs(user.userId);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="space-y-2">
        <Badge className="bg-[#FF6B7A] text-white border-2 border-black font-bold uppercase text-[11px]">
          Bookmarks
        </Badge>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Saved Jobs</h1>
        <p className="text-muted-foreground font-medium text-sm md:text-base max-w-2xl leading-relaxed">
          Positions you have bookmarked to review or apply for later.
        </p>
      </div>

      {savedList.length === 0 ? (
        <div className="bg-white dark:bg-[#191919] border-3 border-black rounded-3xl p-10 md:p-14 text-center shadow-neo space-y-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black">No saved jobs yet</h3>
            <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto">
              Explore open positions in the catalog and click the bookmark icon to save them here.
            </p>
          </div>
          <Button asChild className="rounded-xl font-bold mt-2 shadow-neo-sm">
            <Link href="/jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {savedList.map((item) => {
            const job = item.job;
            const company = job.companyId;

            return (
              <div
                key={item._id}
                className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-neo hover:shadow-neo-lg transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase text-muted-foreground">
                      {company?.name || "Company"}
                    </span>
                    <span>•</span>
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </span>
                    <span>•</span>
                    <Badge
                      variant="outline"
                      className="border-2 border-black text-[11px] font-bold"
                    >
                      {formatJobType(job.type)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-2 border-black text-[11px] font-bold bg-[#2F81F7]/10 text-[#2F81F7]"
                    >
                      {formatLocationType(job.locationType)}
                    </Badge>
                  </div>

                  <Link href={`/jobs/${job.slug}`}>
                    <h3 className="text-lg md:text-xl font-black text-neutral-900 dark:text-neutral-100 hover:text-[#2F81F7] transition-colors leading-tight truncate">
                      {job.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1 font-black text-sm text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-4 h-4 shrink-0" />
                    <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-black/10">
                  <Button
                    asChild
                    size="sm"
                    className="rounded-xl font-bold flex-1 md:flex-none shadow-neo-sm"
                  >
                    <Link href={`/jobs/${job.slug}`}>
                      <span>View Role</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>

                  <SaveButton jobId={job._id.toString()} initialSaved={true} variant="icon" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
