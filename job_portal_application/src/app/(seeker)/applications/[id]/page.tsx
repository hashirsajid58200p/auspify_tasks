import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Building2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireServerUser } from "@/server/auth/server-session";
import { getApplicationById } from "@/server/services/applications";
import { StatusStepper } from "@/components/applications/status-stepper";
import { WithdrawButton } from "./withdraw-button";

export const metadata: Metadata = {
  title: "Application Status Tracker | Candidate Portal",
  description: "Live state machine status tracker for your job application.",
};

export const dynamic = "force-dynamic";

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { id } = await params;
  const user = await requireServerUser(["JOB_SEEKER"]);

  let application: any;
  try {
    application = await getApplicationById(id, user);
  } catch {
    notFound();
  }

  const job = application.jobId;
  const company = job?.companyId;
  const snapshot = application.profileSnapshot || {};
  const isWithdrawable = ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW"].includes(
    application.status,
  );

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back button */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="font-bold flex items-center gap-1.5 -ml-2"
        >
          <Link href="/applications">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Applications</span>
          </Link>
        </Button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-6 md:p-8 shadow-neo space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-[#2F81F7] text-white border-2 border-black font-bold uppercase text-[11px]">
              Application Tracker
            </Badge>
            <h1 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-neutral-100">
              {job?.title || "Job Listing"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted-foreground">
              {company?.slug ? (
                <Link
                  href={`/companies/${company.slug}`}
                  className="hover:underline text-foreground"
                >
                  {company?.name || "Company"}
                </Link>
              ) : (
                <span>{company?.name || "Company"}</span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job?.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Applied {new Date(application.appliedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {isWithdrawable && (
            <div className="w-full md:w-auto">
              <WithdrawButton applicationId={application._id.toString()} />
            </div>
          )}
        </div>

        {/* Status Stepper */}
        <div className="pt-6 border-t-2 border-black/10 dark:border-white/10">
          <StatusStepper status={application.status} statusHistory={application.statusHistory} />
        </div>
      </div>

      {/* Two Column details: Cover Letter & Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cover Letter */}
        <div className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-6 shadow-neo space-y-3">
          <h2 className="text-base font-black uppercase tracking-wider text-muted-foreground">
            Cover Letter Submitted
          </h2>
          {application.coverLetter ? (
            <p className="text-xs md:text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap font-medium">
              {application.coverLetter}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground font-medium italic">
              No cover letter was included with this application.
            </p>
          )}
        </div>

        {/* Snapshot Overview */}
        <div className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-6 shadow-neo space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black uppercase tracking-wider text-muted-foreground">
              Preserved Profile Snapshot
            </h2>
            <Badge variant="outline" className="border-2 border-black text-[10px] font-bold">
              Immutable
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-black text-sm">
                {snapshot.headline || "Headline not specified"}
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                {snapshot.location || "Location not set"} • {snapshot.experienceYears || 0} years
                experience
              </p>
            </div>

            {snapshot.bio && (
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium line-clamp-3">
                {snapshot.bio}
              </p>
            )}

            {snapshot.skills && snapshot.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {snapshot.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-black/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {snapshot.links?.resumeUrl && (
              <div className="pt-2 border-t border-black/10">
                <a
                  href={snapshot.links.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#2F81F7] font-bold hover:underline"
                >
                  <span>View Submitted Resume</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
