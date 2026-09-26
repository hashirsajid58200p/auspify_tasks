import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Application } from "@/server/models/application";
import { Job } from "@/server/models/job";
import { Company } from "@/server/models/company";
import { Category } from "@/server/models/category";
import { SeekerProfile } from "@/server/models/seeker-profile";
import {
  applyToJob,
  transitionApplicationStatus,
  withdrawApplication,
  getApplicationById,
  getJobApplicants,
} from "@/server/services/applications";
import { upsertSeekerProfile } from "@/server/services/profiles";
import { NotFoundError, ConflictError, BadRequestError } from "@/server/http";
import { CurrentUser } from "@/server/auth/session";

describe("Application Service, Snapshot Immutability & State Machine", () => {
  let mongoServer: MongoMemoryServer;
  let employerA: Types.ObjectId;
  let employerB: Types.ObjectId;
  let seekerA: Types.ObjectId;
  let seekerB: Types.ObjectId;
  let publishedJobId: Types.ObjectId;

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
    await Application.deleteMany({});
    await Job.deleteMany({});
    await Company.deleteMany({});
    await Category.deleteMany({});
    await SeekerProfile.deleteMany({});

    employerA = new Types.ObjectId();
    employerB = new Types.ObjectId();
    seekerA = new Types.ObjectId();
    seekerB = new Types.ObjectId();

    const cat = await Category.create({ name: "Engineering", slug: "engineering" });
    const comp = await Company.create({
      ownerId: employerA,
      name: "Acme Corp",
      slug: "acme-corp",
      description: "Acme software",
      location: "San Francisco, CA",
      industry: "Technology",
      size: "11-50",
    });

    const job = await Job.create({
      employerId: employerA,
      companyId: comp._id,
      categoryId: cat._id,
      title: "Senior Backend Engineer",
      slug: "senior-backend-engineer",
      description: "Full stack engineering role.",
      type: "FULL_TIME",
      locationType: "REMOTE",
      location: "Remote",
      experienceLevel: "SENIOR",
      skills: ["Node.js", "TypeScript"],
      salaryMin: 120000,
      salaryMax: 150000,
      status: "PUBLISHED",
      publishedAt: new Date(),
    });
    publishedJobId = job._id;

    // Seed candidate profile
    await upsertSeekerProfile(seekerA.toString(), {
      headline: "Senior Backend Developer",
      bio: "10 years writing robust backend services.",
      skills: ["Node.js", "TypeScript", "MongoDB"],
      experienceYears: 10,
      location: "Austin, TX",
      links: {
        github: "https://github.com/seekera",
      },
    });
  });

  describe("Application Submission & Snapshot Immutability", () => {
    it("captures an immutable snapshot of the seeker profile at apply time", async () => {
      const app = await applyToJob(seekerA.toString(), {
        jobId: publishedJobId.toString(),
        coverLetter: "Excited to join Acme Corp!",
      });

      expect(app).toBeDefined();
      expect(app.status).toBe("SUBMITTED");
      expect(app.profileSnapshot.headline).toBe("Senior Backend Developer");
      expect(app.profileSnapshot.skills).toEqual(["Node.js", "TypeScript", "MongoDB"]);
      expect(app.profileSnapshot.experienceYears).toBe(10);
      expect(app.coverLetter).toBe("Excited to join Acme Corp!");

      // Verify Job.applicationCount incremented
      const updatedJob = await Job.findById(publishedJobId);
      expect(updatedJob?.applicationCount).toBe(1);

      // Now mutate the live seeker profile
      await upsertSeekerProfile(seekerA.toString(), {
        headline: "Chief Technology Officer",
        bio: "Completely new altered bio.",
        skills: ["Rust", "Solidity"],
        experienceYears: 15,
      });

      // Verify the application profileSnapshot remains unchanged!
      const freshApp = await Application.findById(app._id);
      expect(freshApp?.profileSnapshot.headline).toBe("Senior Backend Developer");
      expect(freshApp?.profileSnapshot.skills).toEqual(["Node.js", "TypeScript", "MongoDB"]);
      expect(freshApp?.profileSnapshot.experienceYears).toBe(10);
    });

    it("rejects duplicate applications for the same job with ConflictError", async () => {
      await applyToJob(seekerA.toString(), {
        jobId: publishedJobId.toString(),
      });

      await expect(
        applyToJob(seekerA.toString(), {
          jobId: publishedJobId.toString(),
        }),
      ).rejects.toThrow(ConflictError);
    });

    it("handles parallel apply attempts gracefully via unique index and returns 409", async () => {
      const results = await Promise.allSettled([
        applyToJob(seekerA.toString(), { jobId: publishedJobId.toString() }),
        applyToJob(seekerA.toString(), { jobId: publishedJobId.toString() }),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);
    });
  });

  describe("State Machine Status Transitions", () => {
    let application: any;
    let employerActor: CurrentUser;
    let seekerActor: CurrentUser;

    beforeEach(async () => {
      application = await applyToJob(seekerA.toString(), {
        jobId: publishedJobId.toString(),
      });

      employerActor = {
        userId: employerA.toString(),
        email: "employer@acme.com",
        name: "Acme Employer",
        role: "EMPLOYER",
        status: "ACTIVE",
        isDemo: false,
      };

      seekerActor = {
        userId: seekerA.toString(),
        email: "seeker@dev.com",
        name: "Dev Seeker",
        role: "JOB_SEEKER",
        status: "ACTIVE",
        isDemo: false,
      };
    });

    it("allows legal forward moves: SUBMITTED -> UNDER_REVIEW -> SHORTLISTED -> INTERVIEW -> OFFERED", async () => {
      let app = await transitionApplicationStatus(
        application._id.toString(),
        "UNDER_REVIEW",
        employerActor,
      );
      expect(app.status).toBe("UNDER_REVIEW");
      expect(app.statusHistory.length).toBe(2);

      app = await transitionApplicationStatus(
        application._id.toString(),
        "SHORTLISTED",
        employerActor,
      );
      expect(app.status).toBe("SHORTLISTED");

      app = await transitionApplicationStatus(
        application._id.toString(),
        "INTERVIEW",
        employerActor,
      );
      expect(app.status).toBe("INTERVIEW");

      app = await transitionApplicationStatus(application._id.toString(), "OFFERED", employerActor);
      expect(app.status).toBe("OFFERED");
    });

    it("allows employer to reject application at intermediate stages", async () => {
      await transitionApplicationStatus(application._id.toString(), "UNDER_REVIEW", employerActor);
      const rejected = await transitionApplicationStatus(
        application._id.toString(),
        "REJECTED",
        employerActor,
      );
      expect(rejected.status).toBe("REJECTED");
    });

    it("rejects illegal transitions like SUBMITTED straight to OFFERED", async () => {
      await expect(
        transitionApplicationStatus(application._id.toString(), "OFFERED", employerActor),
      ).rejects.toThrow(BadRequestError);
    });

    it("allows candidate to withdraw while in active status", async () => {
      const withdrawn = await withdrawApplication(application._id.toString(), seekerActor);
      expect(withdrawn.status).toBe("WITHDRAWN");
    });

    it("blocks candidate from withdrawing once OFFERED or REJECTED", async () => {
      await transitionApplicationStatus(application._id.toString(), "UNDER_REVIEW", employerActor);
      await transitionApplicationStatus(application._id.toString(), "REJECTED", employerActor);

      await expect(withdrawApplication(application._id.toString(), seekerActor)).rejects.toThrow(
        BadRequestError,
      );
    });

    it("blocks employer from setting status to WITHDRAWN", async () => {
      await expect(
        transitionApplicationStatus(application._id.toString(), "WITHDRAWN", employerActor),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Anti-Enumeration and Cross-User Access Policies", () => {
    let application: any;

    beforeEach(async () => {
      application = await applyToJob(seekerA.toString(), {
        jobId: publishedJobId.toString(),
      });
    });

    it("returns 404 Not Found when another seeker attempts to access the application", async () => {
      const foreignSeeker: CurrentUser = {
        userId: seekerB.toString(),
        email: "other@seeker.com",
        name: "Foreign Seeker",
        role: "JOB_SEEKER",
        status: "ACTIVE",
        isDemo: false,
      };

      await expect(getApplicationById(application._id.toString(), foreignSeeker)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("returns 404 Not Found when another employer attempts to access or transition the application", async () => {
      const foreignEmployer: CurrentUser = {
        userId: employerB.toString(),
        email: "other@employer.com",
        name: "Foreign Employer",
        role: "EMPLOYER",
        status: "ACTIVE",
        isDemo: false,
      };

      await expect(getApplicationById(application._id.toString(), foreignEmployer)).rejects.toThrow(
        NotFoundError,
      );

      await expect(
        transitionApplicationStatus(application._id.toString(), "UNDER_REVIEW", foreignEmployer),
      ).rejects.toThrow(NotFoundError);
    });

    it("returns 404 when foreign employer attempts to list applicants for another employer's job", async () => {
      await expect(
        getJobApplicants(publishedJobId.toString(), employerB.toString()),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
