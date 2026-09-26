import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireServerUser } from "@/server/auth/server-session";
import { getJobApplicants } from "@/server/services/applications";
import { ApplicantsClient } from "./applicants-client";

export const metadata: Metadata = {
  title: "Candidate Review & Applicants | Employer Console",
  description: "Review applicant credentials and advance hiring stages.",
};

export const dynamic = "force-dynamic";

interface ApplicantsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicantsPage({ params }: ApplicantsPageProps) {
  const { id } = await params;
  const user = await requireServerUser(["EMPLOYER"]);

  let data: any;
  try {
    data = await getJobApplicants(id, user.userId);
  } catch {
    notFound();
  }

  const { job, applications } = data;

  const serializedJob = {
    _id: job._id.toString(),
    title: job.title,
    location: job.location,
    status: job.status,
  };

  const serializedApplications = applications.map((app: any) => ({
    _id: app._id.toString(),
    status: app.status,
    appliedAt: app.appliedAt ? new Date(app.appliedAt).toISOString() : new Date().toISOString(),
    coverLetter: app.coverLetter || "",
    seekerId: app.seekerId
      ? {
          _id: app.seekerId._id?.toString(),
          name: app.seekerId.name,
          email: app.seekerId.email,
        }
      : undefined,
    profileSnapshot: app.profileSnapshot || {},
    statusHistory: (app.statusHistory || []).map((h: any) => ({
      status: h.status,
      changedAt: h.changedAt ? new Date(h.changedAt).toISOString() : new Date().toISOString(),
    })),
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <ApplicantsClient job={serializedJob} initialApplications={serializedApplications} />
    </div>
  );
}
