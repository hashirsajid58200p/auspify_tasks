import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Job } from "@/server/models/job";
import { Company } from "@/server/models/company";
import { Category } from "@/server/models/category";
import { SeekerProfile } from "@/server/models/seeker-profile";
import { Application } from "@/server/models/application";
import { Session } from "@/server/models/session";
import { upsertEmployerCompany } from "@/server/services/companies";
import { createJob, publishEmployerJob } from "@/server/services/jobs";
import { searchPublishedJobs, getPublishedJobBySlug } from "@/server/services/catalog";
import { upsertSeekerProfile } from "@/server/services/profiles";
import {
  applyToJob,
  transitionApplicationStatus,
  getApplicationById,
  getJobApplicants,
} from "@/server/services/applications";
import { CurrentUser } from "@/server/auth/session";
import { ConflictError, BadRequestError, NotFoundError } from "@/server/http";

describe("End-to-End User Journey (Smoke Test across Roles)", () => {
  let mongoServer: MongoMemoryServer;

  let employerUser: CurrentUser;
  let seekerUser: CurrentUser;
  let categoryId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Job.deleteMany({});
    await Company.deleteMany({});
    await Category.deleteMany({});
    await SeekerProfile.deleteMany({});
    await Application.deleteMany({});
    await Session.deleteMany({});

    const employerId = new Types.ObjectId().toString();
    const seekerId = new Types.ObjectId().toString();

    employerUser = {
      userId: employerId,
      name: "Acme Recruiter",
      email: "recruiter@acme.test",
      role: "EMPLOYER",
      status: "ACTIVE",
      isDemo: false,
    };

    seekerUser = {
      userId: seekerId,
      name: "Jane Candidate",
      email: "jane@candidate.test",
      role: "JOB_SEEKER",
      status: "ACTIVE",
      isDemo: false,
    };

    await User.create([
      {
        _id: new Types.ObjectId(employerId),
        name: employerUser.name,
        email: employerUser.email,
        passwordHash: "hash123",
        role: "EMPLOYER",
        status: "ACTIVE",
      },
      {
        _id: new Types.ObjectId(seekerId),
        name: seekerUser.name,
        email: seekerUser.email,
        passwordHash: "hash456",
        role: "JOB_SEEKER",
        status: "ACTIVE",
      },
    ]);

    const category = await Category.create({
      name: "Software Engineering",
      slug: "software-engineering",
      jobCount: 0,
    });
    categoryId = category._id.toString();
  });

  it("Executes the complete hiring lifecycle from job post to hiring offer", async () => {
    // 1. Employer creates Company profile
    const company = await upsertEmployerCompany(employerUser.userId, {
      name: "Acme Corporation",
      description: "Innovating cloud infrastructure at scale",
      size: "51-200",
      industry: "Technology",
      location: "San Francisco, CA",
      website: "https://acme.test",
    });
    expect(company.name).toBe("Acme Corporation");

    // 2. Employer creates draft job posting
    const draftJob = await createJob(employerUser.userId, {
      title: "Senior Backend Engineer",
      categoryId,
      type: "FULL_TIME",
      locationType: "REMOTE",
      location: "Remote - US",
      experienceLevel: "SENIOR",
      salaryMin: 140000,
      salaryMax: 180000,
      salaryCurrency: "USD",
      skills: ["Go", "Distributed Systems", "PostgreSQL"],
      description: "We are seeking a senior backend engineer to scale our microservices.",
    });
    expect(draftJob.status).toBe("DRAFT");

    // 3. Draft job is NOT discoverable in public catalog search
    const preCatalog = await searchPublishedJobs({ q: "Senior Backend" });
    expect(preCatalog.jobs.length).toBe(0);

    // 4. Employer publishes the job
    const published = await publishEmployerJob(employerUser.userId, draftJob._id.toString());
    expect(published.status).toBe("PUBLISHED");

    // 5. Category jobCount is automatically incremented
    const updatedCategory = await Category.findById(categoryId);
    expect(updatedCategory?.jobCount).toBe(1);

    // 6. Job is now public in search catalog
    const postCatalog = await searchPublishedJobs({ q: "Senior Backend" });
    expect(postCatalog.jobs.length).toBe(1);
    expect(postCatalog.jobs[0].title).toBe("Senior Backend Engineer");

    // 7. Candidate discovers job via slug
    const jobDetail = await getPublishedJobBySlug(published.slug);
    expect(jobDetail._id.toString()).toBe(published._id.toString());

    // 8. Candidate completes profile
    await upsertSeekerProfile(seekerUser.userId, {
      headline: "Senior Systems Programmer",
      bio: "10 years building high-throughput distributed backends",
      experienceYears: 8,
      location: "Seattle, WA",
      skills: ["Go", "Kubernetes", "PostgreSQL"],
      links: {
        github: "https://github.com/janecandidate",
        linkedin: "https://linkedin.com/in/janecandidate",
      },
    });

    // 9. Candidate submits application with cover letter
    const application = await applyToJob(seekerUser.userId, {
      jobId: published._id.toString(),
      coverLetter: "I have 8+ years of Go experience and would love to contribute to Acme.",
    });
    expect(application.status).toBe("SUBMITTED");
    expect(application.profileSnapshot.headline).toBe("Senior Systems Programmer");

    // 10. Duplicate application attempt is strictly blocked (409 Conflict)
    await expect(
      applyToJob(seekerUser.userId, {
        jobId: published._id.toString(),
        coverLetter: "Second attempt",
      }),
    ).rejects.toThrow(ConflictError);

    // 11. Employer reviews applicant list
    const { applications } = await getJobApplicants(published._id.toString(), employerUser.userId);
    expect(applications.length).toBe(1);
    expect((applications[0].seekerId as any)._id.toString()).toBe(seekerUser.userId);

    // 12. Candidate edits live profile; snapshot remains immutable
    await upsertSeekerProfile(seekerUser.userId, {
      headline: "Completely Changed Headline After Apply",
    });
    const reviewedApp = await getApplicationById(application._id.toString(), employerUser);
    expect(reviewedApp.profileSnapshot.headline).toBe("Senior Systems Programmer");

    // 13. Employer advances application through the State Machine:
    // SUBMITTED -> UNDER_REVIEW
    const underReview = await transitionApplicationStatus(
      application._id.toString(),
      "UNDER_REVIEW",
      employerUser,
    );
    expect(underReview.status).toBe("UNDER_REVIEW");

    // UNDER_REVIEW -> SHORTLISTED
    const shortlisted = await transitionApplicationStatus(
      application._id.toString(),
      "SHORTLISTED",
      employerUser,
    );
    expect(shortlisted.status).toBe("SHORTLISTED");

    // SHORTLISTED -> INTERVIEW
    const interview = await transitionApplicationStatus(
      application._id.toString(),
      "INTERVIEW",
      employerUser,
    );
    expect(interview.status).toBe("INTERVIEW");

    // INTERVIEW -> OFFERED
    const offered = await transitionApplicationStatus(
      application._id.toString(),
      "OFFERED",
      employerUser,
    );
    expect(offered.status).toBe("OFFERED");
    expect(offered.statusHistory.length).toBe(5); // SUBMITTED, UNDER_REVIEW, SHORTLISTED, INTERVIEW, OFFERED

    // 14. Illegal jump (e.g. attempting to jump backwards or illegally) rejected
    await expect(
      transitionApplicationStatus(application._id.toString(), "SUBMITTED", employerUser),
    ).rejects.toThrow(BadRequestError);

    // 15. Candidate cannot withdraw once OFFERED
    await expect(
      transitionApplicationStatus(application._id.toString(), "WITHDRAWN", seekerUser),
    ).rejects.toThrow(BadRequestError);

    // 16. Candidate inspects final application status
    const seekerCheck = await getApplicationById(application._id.toString(), seekerUser);
    expect(seekerCheck.status).toBe("OFFERED");
  });
});
