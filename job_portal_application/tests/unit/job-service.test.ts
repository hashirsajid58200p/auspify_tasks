import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Job } from "@/server/models/job";
import { Company } from "@/server/models/company";
import { Category } from "@/server/models/category";
import { Application } from "@/server/models/application";
import {
  createJob,
  getEmployerJobs,
  getEmployerJobById,
  updateEmployerJob,
  deleteEmployerJob,
  publishEmployerJob,
  closeEmployerJob,
  reopenEmployerJob,
  archiveEmployerJob,
  sanitizeSkills,
} from "@/server/services/jobs";
import { BadRequestError, ValidationError } from "@/server/http";

describe("Job Service & Lifecycle Transitions", () => {
  let mongoServer: MongoMemoryServer;
  let categoryId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    const cat = await Category.create({
      name: "Engineering",
      slug: "engineering",
      jobCount: 0,
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
    await Application.deleteMany({});
    await Category.findByIdAndUpdate(categoryId, { $set: { jobCount: 0 } });
  });

  describe("Skills Sanitization", () => {
    it("should trim, deduplicate, and cap skills to 15", () => {
      const raw = [" React ", "React", "TypeScript", "Node.js", " React", "Docker"];
      const cleaned = sanitizeSkills(raw);
      expect(cleaned).toEqual(["React", "TypeScript", "Node.js", "Docker"]);

      const longList = Array.from({ length: 25 }, (_, i) => `Skill${i}`);
      const capped = sanitizeSkills(longList);
      expect(capped.length).toBe(15);
    });
  });

  describe("Job Creation & Validation", () => {
    it("should reject job creation if employer has not set up a company", async () => {
      const employerId = new Types.ObjectId().toString();

      await expect(
        createJob(employerId, {
          title: "Senior Backend Engineer",
          description: "A comprehensive description that exceeds thirty characters easily.",
          categoryId,
          type: "FULL_TIME",
          locationType: "REMOTE",
          location: "Global",
          experienceLevel: "SENIOR",
          skills: ["Go", "Kubernetes"],
          salaryMin: 120000,
          salaryMax: 160000,
          salaryCurrency: "USD",
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("should create a job in DRAFT status with unique slug and company linkage", async () => {
      const employerId = new Types.ObjectId().toString();
      const company = await Company.create({
        ownerId: new Types.ObjectId(employerId),
        name: "Test Corp",
        slug: "test-corp",
        description: "Company description here for validation rules.",
        location: "Austin, TX",
        industry: "Software",
        size: "11-50",
      });

      const job = await createJob(employerId, {
        title: "Frontend Architect",
        description: "Building responsive next-gen interfaces with React 19.",
        categoryId,
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Worldwide",
        experienceLevel: "LEAD",
        skills: ["React", "TypeScript", "Next.js"],
        salaryMin: 140000,
        salaryMax: 180000,
        salaryCurrency: "USD",
      });

      expect(job).toBeDefined();
      expect(job.status).toBe("DRAFT");
      expect(job.companyId.toString()).toBe(company._id.toString());
      expect(job.slug.startsWith("frontend-architect-")).toBe(true);
      expect(job.applicationCount).toBe(0);
      expect(job.viewCount).toBe(0);
    });
  });

  describe("Publishing Rules & Category Counters", () => {
    it("should reject publishing if company profile is missing or skills are empty", async () => {
      const employerId = new Types.ObjectId().toString();

      // Case 1: Non-existent company profile
      const jobWithoutCompany = await Job.create({
        employerId: new Types.ObjectId(employerId),
        companyId: new Types.ObjectId(), // No matching company in DB
        title: "DevOps Engineer",
        slug: "devops-engineer-abc",
        description: "Comprehensive job description for devops position.",
        categoryId: new Types.ObjectId(categoryId),
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "MID",
        skills: ["AWS"],
        salaryMin: 90000,
        salaryMax: 130000,
        status: "DRAFT",
      });

      await expect(
        publishEmployerJob(employerId, jobWithoutCompany._id.toString()),
      ).rejects.toThrow(ValidationError);

      // Case 2: Company exists but job has empty skills
      const company = await Company.create({
        ownerId: new Types.ObjectId(employerId),
        name: "Test Co",
        slug: "test-co",
        description: "Valid detailed company description.",
        location: "Chicago, IL",
        industry: "Finance",
        size: "51-200",
      });

      const jobWithoutSkills = await Job.create({
        employerId: new Types.ObjectId(employerId),
        companyId: company._id,
        title: "DevOps Engineer 2",
        slug: "devops-engineer-xyz",
        description: "Comprehensive job description for devops position.",
        categoryId: new Types.ObjectId(categoryId),
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "MID",
        skills: [], // Missing skills
        salaryMin: 90000,
        salaryMax: 130000,
        status: "DRAFT",
      });

      await expect(publishEmployerJob(employerId, jobWithoutSkills._id.toString())).rejects.toThrow(
        ValidationError,
      );
    });

    it("should publish a valid job and increment category jobCount", async () => {
      const employerId = new Types.ObjectId().toString();
      const company = await Company.create({
        ownerId: new Types.ObjectId(employerId),
        name: "Complete Co",
        slug: "complete-co",
        description: "Valid detailed company description.",
        location: "Chicago, IL",
        industry: "Finance",
        size: "51-200",
      });

      const job = await Job.create({
        employerId: new Types.ObjectId(employerId),
        companyId: company._id,
        title: "Staff Engineer",
        slug: "staff-engineer-123",
        description: "Building resilient microservices and high-throughput APIs.",
        categoryId: new Types.ObjectId(categoryId),
        type: "FULL_TIME",
        locationType: "HYBRID",
        location: "Chicago, IL",
        experienceLevel: "SENIOR",
        skills: ["Python", "Docker"],
        salaryMin: 150000,
        salaryMax: 200000,
        status: "DRAFT",
      });

      const published = await publishEmployerJob(employerId, job._id.toString());
      expect(published.status).toBe("PUBLISHED");
      expect(published.publishedAt).toBeInstanceOf(Date);

      const category = await Category.findById(categoryId);
      expect(category?.jobCount).toBe(1);

      // Closing job decrements category counter
      await closeEmployerJob(employerId, job._id.toString());
      const catClosed = await Category.findById(categoryId);
      expect(catClosed?.jobCount).toBe(0);

      // Reopening job increments category counter
      await reopenEmployerJob(employerId, job._id.toString());
      const catReopened = await Category.findById(categoryId);
      expect(catReopened?.jobCount).toBe(1);

      // Archiving job decrements category counter
      await archiveEmployerJob(employerId, job._id.toString());
      const catArchived = await Category.findById(categoryId);
      expect(catArchived?.jobCount).toBe(0);
    });
  });

  describe("Deletion Rules & Application Safeguard", () => {
    it("should allow deleting a job with 0 applications", async () => {
      const employerId = new Types.ObjectId().toString();
      const job = await Job.create({
        employerId: new Types.ObjectId(employerId),
        companyId: new Types.ObjectId(),
        title: "Temporary Role",
        slug: "temp-role-001",
        description: "Description for temporary role.",
        categoryId: new Types.ObjectId(categoryId),
        type: "CONTRACT",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "ENTRY",
        skills: ["QA"],
        salaryMin: 50000,
        salaryMax: 70000,
        status: "DRAFT",
        applicationCount: 0,
      });

      const res = await deleteEmployerJob(employerId, job._id.toString());
      expect(res.success).toBe(true);

      const exists = await Job.findById(job._id);
      expect(exists).toBeNull();
    });

    it("should block deletion if job has received any applications (must archive instead)", async () => {
      const employerId = new Types.ObjectId().toString();
      const job = await Job.create({
        employerId: new Types.ObjectId(employerId),
        companyId: new Types.ObjectId(),
        title: "Popular Role",
        slug: "popular-role-002",
        description: "Description for popular role with candidate interest.",
        categoryId: new Types.ObjectId(categoryId),
        type: "FULL_TIME",
        locationType: "ONSITE",
        location: "NYC",
        experienceLevel: "MID",
        skills: ["Java"],
        salaryMin: 100000,
        salaryMax: 130000,
        status: "PUBLISHED",
        applicationCount: 1, // Has application
      });

      await expect(deleteEmployerJob(employerId, job._id.toString())).rejects.toThrow(
        BadRequestError,
      );
    });
  });
});
