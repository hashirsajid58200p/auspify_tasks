"use client";

import * as React from "react";
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  FileText,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";
import { ApplicationStatus } from "@/server/models/application";

interface ApplicantReviewModalProps {
  application: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated: (applicationId: string, newStatus: ApplicationStatus) => void;
}

export function ApplicantReviewModal({
  application,
  open,
  onOpenChange,
  onStatusUpdated,
}: ApplicantReviewModalProps) {
  const [updating, setUpdating] = React.useState(false);

  if (!application) return null;

  const candidateName = application.seekerId?.name || "Candidate";
  const candidateEmail = application.seekerId?.email || "";
  const snapshot = application.profileSnapshot || {};
  const currentStatus: ApplicationStatus = application.status;

  async function handleTransition(newStatus: ApplicationStatus) {
    setUpdating(true);
    try {
      await fetchApi(`/api/applications/${application._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      onStatusUpdated(application._id, newStatus);
      toast.success(`Application updated to ${newStatus.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update application status.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 border-3 border-black rounded-3xl shadow-neo-lg space-y-6">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge className="border-2 border-black font-bold uppercase text-[11px] bg-[#FFE500] text-black">
              Applicant Review
            </Badge>
            <Badge variant="outline" className="border-2 border-black font-extrabold text-xs">
              Status: {currentStatus.replace("_", " ")}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-black">{candidateName}</DialogTitle>
          <DialogDescription className="text-xs font-semibold text-muted-foreground flex flex-wrap items-center gap-3">
            {candidateEmail && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {candidateEmail}
              </span>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Applied {new Date(application.appliedAt).toLocaleDateString()}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* State Machine Transition Actions Banner */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border-2 border-black rounded-2xl space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
            State Machine Workflow Action
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {currentStatus === "SUBMITTED" && (
              <>
                <Button
                  onClick={() => handleTransition("UNDER_REVIEW")}
                  disabled={updating}
                  className="rounded-xl font-bold bg-[#2F81F7] text-white flex items-center gap-1.5"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>Move to Under Review</span>
                </Button>
                <Button
                  onClick={() => handleTransition("REJECTED")}
                  disabled={updating}
                  variant="outline"
                  className="rounded-xl font-bold border-2 border-red-500 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  <span>Reject</span>
                </Button>
              </>
            )}

            {currentStatus === "UNDER_REVIEW" && (
              <>
                <Button
                  onClick={() => handleTransition("SHORTLISTED")}
                  disabled={updating}
                  className="rounded-xl font-bold bg-[#FFC224] text-black hover:bg-[#ebd523] flex items-center gap-1.5"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Shortlist Candidate</span>
                </Button>
                <Button
                  onClick={() => handleTransition("REJECTED")}
                  disabled={updating}
                  variant="outline"
                  className="rounded-xl font-bold border-2 border-red-500 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  <span>Reject</span>
                </Button>
              </>
            )}

            {currentStatus === "SHORTLISTED" && (
              <>
                <Button
                  onClick={() => handleTransition("INTERVIEW")}
                  disabled={updating}
                  className="rounded-xl font-bold bg-[#6366F1] text-white flex items-center gap-1.5"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>Schedule Interview</span>
                </Button>
                <Button
                  onClick={() => handleTransition("REJECTED")}
                  disabled={updating}
                  variant="outline"
                  className="rounded-xl font-bold border-2 border-red-500 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  <span>Reject</span>
                </Button>
              </>
            )}

            {currentStatus === "INTERVIEW" && (
              <>
                <Button
                  onClick={() => handleTransition("OFFERED")}
                  disabled={updating}
                  className="rounded-xl font-bold bg-[#10B981] text-white flex items-center gap-1.5"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Extend Job Offer</span>
                </Button>
                <Button
                  onClick={() => handleTransition("REJECTED")}
                  disabled={updating}
                  variant="outline"
                  className="rounded-xl font-bold border-2 border-red-500 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  <span>Reject</span>
                </Button>
              </>
            )}

            {currentStatus === "OFFERED" && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Offer has been extended to this candidate.</span>
              </span>
            )}

            {currentStatus === "REJECTED" && (
              <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                <span>Application has been marked as rejected.</span>
              </span>
            )}

            {currentStatus === "WITHDRAWN" && (
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Application was withdrawn by candidate.</span>
              </span>
            )}
          </div>
        </div>

        {/* Cover Letter Section */}
        {application.coverLetter && (
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
              Cover Letter
            </span>
            <div className="p-4 bg-white dark:bg-neutral-800 border-2 border-black rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {application.coverLetter}
            </div>
          </div>
        )}

        {/* Immutable Candidate Profile Snapshot */}
        <div className="space-y-4 pt-2 border-t-2 border-black/10 dark:border-white/10">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
            Immutable Candidate Snapshot (At Apply Time)
          </span>

          <div className="p-5 bg-white dark:bg-neutral-800 border-2 border-black rounded-2xl space-y-4">
            <div>
              <h4 className="font-black text-base">
                {snapshot.headline || "Headline not specified"}
              </h4>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold mt-1">
                {snapshot.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {snapshot.location}
                  </span>
                )}
                <span>•</span>
                <span>{snapshot.experienceYears || 0} years experience</span>
              </div>
            </div>

            {snapshot.bio && (
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap">
                {snapshot.bio}
              </p>
            )}

            {snapshot.skills && snapshot.skills.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  Candidate Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {snapshot.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-700 border border-black/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Candidate Links */}
            {snapshot.links && (
              <div className="pt-2 border-t border-black/10 flex flex-wrap gap-3 text-xs">
                {snapshot.links.resumeUrl && (
                  <a
                    href={snapshot.links.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#2F81F7] font-bold hover:underline"
                  >
                    <span>View Resume / CV</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {snapshot.links.github && (
                  <a
                    href={snapshot.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold hover:underline"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {snapshot.links.linkedin && (
                  <a
                    href={snapshot.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold hover:underline"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {snapshot.links.portfolio && (
                  <a
                    href={snapshot.links.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold hover:underline"
                  >
                    <span>Portfolio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-2 border-black font-bold"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
