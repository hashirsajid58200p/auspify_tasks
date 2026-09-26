import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Job } from "@/server/models/job";
import { Company } from "@/server/models/company";
import { Category } from "@/server/models/category";
import {
  getEmployerJobById,
  updateEmployerJob,
  deleteEmployerJob,
  publishEmployerJob,
} from "@/server/services/jobs";
import { assertCompanyOwner } from "@/server/policies/company-access";
import { NotFoundError } from "@/server/http";

describe("Employer Isolation & Anti-Enumeration (404 Rule)", () => {
  let mongoServer: MongoMemoryServer;
  let categoryId: string;

  const employerA = new Types.ObjectId().toString();
  const employerB = new Types.ObjectId().toString();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    const cat = await Category.create({
      name: "Engineering",
      slug: "engineering",
    });
    categoryId = cat._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Job.deleteMany({});
    await Company.deleteMany({});
  });

  describe("Cross-Employer Job Access", () => {
    it("should return 404 (not 403) when Employer B attempts to read Employer A's job", async () => {
      const jobA = await Job.create({
        employerId: new Types.ObjectId(employerA),
        companyId: new Types.ObjectId(),
        title: "Employer A Secret Role",
        slug: "emp-a-secret-role",
        description: "Confidential job description for employer A.",
        categoryId: new Types.ObjectId(categoryId),
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "SENIOR",
        skills: ["Rust"],
        salaryMin: 160000,
        salaryMax: 200000,
        status: "DRAFT",
      });

      // Employer A succeeds
      const ownJob = await getEmployerJobById(employerA, jobA._id.toString());
      expect(ownJob._id.toString()).toBe(jobA._id.toString());

      // Employer B receives 404 Not Found to prevent ID enumeration
      await expect(getEmployerJobById(employerB, jobA._id.toString())).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should return 404 when Employer B attempts to update Employer A's job", async () => {
      const jobA = await Job.create({
        employerId: new Types.ObjectId(employerA),
        companyId: new Types.ObjectId(),
        title: "Job to Hijack",
        slug: "job-to-hijack",
        description: "Job description for testing hijacking prevention.",
        categoryId: new Types.ObjectId(categoryId),
        type: "FULL_TIME",
        locationType: "ONSITE",
        location: "LA",
        experienceLevel: "MID",
        skills: ["C++"],
        salaryMin: 110000,
        salaryMax: 140000,
        status: "DRAFT",
      });

      await expect(
        updateEmployerJob(employerB, jobA._id.toString(), {
          title: "Malicious Edit",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("should return 404 when Employer B attempts to publish Employer A's job", async () => {
      const jobA = await Job.create({
        employerId: new Types.ObjectId(employerA),
        companyId: new Types.ObjectId(),
        title: "Unpublished Job",
        slug: "unpublished-job",
        description: "Description for unpublished job.",
        categoryId: new Types.ObjectId(categoryId),
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "ENTRY",
        skills: ["HTML"],
        salaryMin: 40000,
        salaryMax: 60000,
        status: "DRAFT",
      });

      await expect(publishEmployerJob(employerB, jobA._id.toString())).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should return 404 when Employer B attempts to delete Employer A's job", async () => {
      const jobA = await Job.create({
        employerId: new Types.ObjectId(employerA),
        companyId: new Types.ObjectId(),
        title: "Delete Target",
        slug: "delete-target",
        description: "Description for delete target.",
        categoryId: new Types.ObjectId(categoryId),
        type: "CONTRACT",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "MID",
        skills: ["Ruby"],
        salaryMin: 80000,
        salaryMax: 100000,
        status: "DRAFT",
      });

      await expect(deleteEmployerJob(employerB, jobA._id.toString())).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("Cross-Employer Company Access", () => {
    it("should reject Employer B accessing Employer A's company with 404", () => {
      const companyOwnerA = new Types.ObjectId();
      const foreignEmployerB = new Types.ObjectId();

      expect(() => assertCompanyOwner(companyOwnerA, foreignEmployerB)).toThrow(NotFoundError);

      expect(() => assertCompanyOwner(companyOwnerA, companyOwnerA)).not.toThrow();
    });
  });
});
