"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Users, Mail, Clock, Eye, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicantReviewModal } from "@/components/applications/applicant-review-modal";
import { ApplicationStatus } from "@/server/models/application";

interface ApplicantsClientProps {
  job: any;
  initialApplications: any[];
}

const TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "All Applicants" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "OFFERED", label: "Offered" },
  { key: "REJECTED", label: "Rejected" },
  { key: "WITHDRAWN", label: "Withdrawn" },
];

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
          Offered
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="border-2 border-red-500 font-extrabold text-xs bg-red-50 text-red-600 dark:bg-red-950/20"
        >
          Rejected
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

export function ApplicantsClient({ job, initialApplications }: ApplicantsClientProps) {
  const [applications, setApplications] = React.useState(initialApplications);
  const [selectedTab, setSelectedTab] = React.useState("ALL");
  const [selectedApp, setSelectedApp] = React.useState<any | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  function handleStatusUpdated(applicationId: string, newStatus: ApplicationStatus) {
    setApplications((prev) =>
      prev.map((app) => (app._id === applicationId ? { ...app, status: newStatus } : app)),
    );
    if (selectedApp && selectedApp._id === applicationId) {
      setSelectedApp((prev: any) => ({ ...prev, status: newStatus }));
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (selectedTab === "ALL") return true;
    return app.status === selectedTab;
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="font-bold flex items-center gap-1.5 -ml-2"
        >
          <Link href="/employer/jobs">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Jobs</span>
          </Link>
        </Button>
      </div>

      {/* Job Header Card */}
      <div className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-6 md:p-8 shadow-neo flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#2F81F7] text-white border-2 border-black font-bold uppercase text-[11px]">
              Candidate Pipeline
            </Badge>
            <Badge variant="outline" className="border-2 border-black font-bold text-xs">
              {job.status}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-neutral-100">
            {job.title}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-semibold">
            {job.location} • {applications.length} total applicant
            {applications.length === 1 ? "" : "s"}
          </p>
        </div>

        <Button asChild variant="outline" className="border-2 border-black rounded-xl font-bold">
          <Link href={`/employer/jobs/${job._id}/edit`}>Edit Job Posting</Link>
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {TABS.map((tab) => {
          const count =
            tab.key === "ALL"
              ? applications.length
              : applications.filter((a) => a.status === tab.key).length;

          const active = selectedTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl border-2 border-black font-bold text-xs transition-all flex items-center gap-1.5 ${
                active
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-neo-sm"
                  : "bg-white dark:bg-[#191919] text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  active
                    ? "bg-white text-black dark:bg-black dark:text-white"
                    : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applicants List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white dark:bg-[#191919] border-3 border-black rounded-3xl p-10 md:p-12 text-center shadow-neo space-y-3">
          <div className="w-14 h-14 rounded-2xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-black">No applicants found in this view</h3>
          <p className="text-xs font-medium text-muted-foreground max-w-sm mx-auto">
            {selectedTab === "ALL"
              ? "Candidates who submit applications will appear here."
              : `There are currently no candidates in the ${selectedTab.replace("_", " ")} stage.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const candidateName = app.seekerId?.name || "Candidate";
            const candidateEmail = app.seekerId?.email || "";
            const snapshot = app.profileSnapshot || {};

            return (
              <div
                key={app._id}
                className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-neo hover:shadow-neo-lg transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black truncate">{candidateName}</h3>
                    {getStatusBadge(app.status)}
                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                    {snapshot.headline || "Headline not specified"}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {candidateEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {candidateEmail}
                      </span>
                    )}
                    <span>•</span>
                    <span>{snapshot.experienceYears || 0} yrs exp</span>
                    {snapshot.location && (
                      <>
                        <span>•</span>
                        <span>{snapshot.location}</span>
                      </>
                    )}
                  </div>

                  {snapshot.skills && snapshot.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {snapshot.skills.slice(0, 5).map((skill: string) => (
                        <span
                          key={skill}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-black/20"
                        >
                          {skill}
                        </span>
                      ))}
                      {snapshot.skills.length > 5 && (
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          +{snapshot.skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-black/10">
                  <Button
                    onClick={() => {
                      setSelectedApp(app);
                      setModalOpen(true);
                    }}
                    className="w-full md:w-auto rounded-xl font-black bg-[#FFE500] text-black hover:bg-[#FFD600] border-2 border-black flex items-center gap-1.5 shadow-neo-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review Candidate</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <ApplicantReviewModal
        application={selectedApp}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}
