import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Job } from "@/server/models/job";
import { Company } from "@/server/models/company";
import { Category } from "@/server/models/category";
import {
  searchPublishedJobs,
  getPublishedJobBySlug,
  getPublicCompanyBySlug,
} from "@/server/services/catalog";
import { NotFoundError } from "@/server/http";

describe("Catalog Service & Search", () => {
  let mongoServer: MongoMemoryServer;
  let engineeringCategory: mongoose.Types.ObjectId;
  let designCategory: mongoose.Types.ObjectId;
  let employerA: mongoose.Types.ObjectId;
  let companyA: mongoose.Types.ObjectId;

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
    await Job.deleteMany({});
    await Company.deleteMany({});
    await Category.deleteMany({});

    employerA = new Types.ObjectId();

    const cat1 = await Category.create({
      name: "Engineering",
      slug: "engineering",
      description: "Software engineering roles",
    });
    engineeringCategory = cat1._id;

    const cat2 = await Category.create({
      name: "Design",
      slug: "design",
      description: "UI and UX design roles",
    });
    designCategory = cat2._id;

    const comp = await Company.create({
      ownerId: employerA,
      name: "TechCorp",
      slug: "techcorp",
      description: "Leading technology enterprise specializing in web systems.",
      location: "San Francisco, CA",
      industry: "Technology",
      size: "51-200",
    });
    companyA = comp._id;
  });

  describe("searchPublishedJobs isolation & filters", () => {
    it("never returns DRAFT, CLOSED, or ARCHIVED jobs even if they match keywords", async () => {
      // 1 Published Job
      await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Senior Full Stack Engineer",
        slug: "senior-full-stack-engineer-1",
        description: "Looking for an experienced React and Node engineer.",
        categoryId: engineeringCategory,
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "SENIOR",
        skills: ["React", "Node.js", "TypeScript"],
        salaryMin: 120000,
        salaryMax: 160000,
        status: "PUBLISHED",
        publishedAt: new Date(),
      });

      // 1 Draft Job with same keyword
      await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Draft React Engineer",
        slug: "draft-react-engineer",
        description: "Draft listing for React developer.",
        categoryId: engineeringCategory,
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "MID",
        skills: ["React"],
        salaryMin: 90000,
        salaryMax: 110000,
        status: "DRAFT",
      });

      // 1 Closed Job with same keyword
      await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Closed React Engineer",
        slug: "closed-react-engineer",
        description: "Closed listing for React developer.",
        categoryId: engineeringCategory,
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "SENIOR",
        skills: ["React"],
        salaryMin: 100000,
        salaryMax: 130000,
        status: "CLOSED",
      });

      // 1 Archived Job with same keyword
      await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Archived React Architect",
        slug: "archived-react-architect",
        description: "Archived listing for React architect.",
        categoryId: engineeringCategory,
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "LEAD",
        skills: ["React"],
        salaryMin: 180000,
        salaryMax: 220000,
        status: "ARCHIVED",
      });

      const res = await searchPublishedJobs({ q: "React", page: 1, limit: 10 });
      expect(res.jobs.length).toBe(1);
      expect(res.jobs[0].title).toBe("Senior Full Stack Engineer");
      expect(res.jobs[0].status).toBe("PUBLISHED");
      expect(res.meta.total).toBe(1);
    });

    it("combines multiple facet filters correctly", async () => {
      // Job 1: Engineering, Remote, Full Time, Senior
      await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Staff Platform Engineer",
        slug: "staff-platform-engineer",
        description: "Core infrastructure engineering.",
        categoryId: engineeringCategory,
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "LEAD",
        skills: ["Go", "Kubernetes"],
        salaryMin: 160000,
        salaryMax: 200000,
        status: "PUBLISHED",
        publishedAt: new Date(),
      });

      // Job 2: Design, Onsite, Contract, Mid
      await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Product Designer",
        slug: "product-designer",
        description: "Figma and design systems expert.",
        categoryId: designCategory,
        type: "CONTRACT",
        locationType: "ONSITE",
        location: "San Francisco, CA",
        experienceLevel: "MID",
        skills: ["Figma", "UI/UX"],
        salaryMin: 80000,
        salaryMax: 100000,
        status: "PUBLISHED",
        publishedAt: new Date(),
      });

      // Filter for category: Engineering
      const engResult = await searchPublishedJobs({
        categoryId: engineeringCategory.toString(),
      });
      expect(engResult.jobs.length).toBe(1);
      expect(engResult.jobs[0].title).toBe("Staff Platform Engineer");

      // Filter for locationType: ONSITE
      const onsiteResult = await searchPublishedJobs({
        locationType: "ONSITE",
      });
      expect(onsiteResult.jobs.length).toBe(1);
      expect(onsiteResult.jobs[0].title).toBe("Product Designer");

      // Filter for salary min 150000
      const salaryResult = await searchPublishedJobs({
        salaryMin: 150000,
      });
      expect(salaryResult.jobs.length).toBe(1);
      expect(salaryResult.jobs[0].title).toBe("Staff Platform Engineer");

      // Filter with impossible combination
      const emptyResult = await searchPublishedJobs({
        categoryId: engineeringCategory.toString(),
        locationType: "ONSITE",
      });
      expect(emptyResult.jobs.length).toBe(0);
    });

    it("supports sorting by salary and pagination", async () => {
      await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Junior Dev",
        slug: "junior-dev",
        description: "Junior developer position.",
        categoryId: engineeringCategory,
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "ENTRY",
        skills: ["JavaScript"],
        salaryMin: 60000,
        salaryMax: 80000,
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - 10000),
      });

      await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Principal Architect",
        slug: "principal-architect",
        description: "Principal architect position.",
        categoryId: engineeringCategory,
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "EXECUTIVE",
        skills: ["Architecture"],
        salaryMin: 200000,
        salaryMax: 250000,
        status: "PUBLISHED",
        publishedAt: new Date(),
      });

      const sorted = await searchPublishedJobs({
        sort: "salary",
        page: 1,
        limit: 10,
      });

      expect(sorted.jobs[0].title).toBe("Principal Architect");
      expect(sorted.jobs[1].title).toBe("Junior Dev");
    });
  });

  describe("getPublishedJobBySlug & atomic view increment", () => {
    it("increments viewCount atomically and returns published job", async () => {
      const job = await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Full Stack Lead",
        slug: "full-stack-lead",
        description: "Full stack engineering team lead.",
        categoryId: engineeringCategory,
        type: "FULL_TIME",
        locationType: "HYBRID",
        location: "San Francisco, CA",
        experienceLevel: "LEAD",
        skills: ["React", "Node.js"],
        salaryMin: 150000,
        salaryMax: 180000,
        status: "PUBLISHED",
        viewCount: 5,
        publishedAt: new Date(),
      });

      const result = await getPublishedJobBySlug("full-stack-lead");
      expect(result._id.toString()).toBe(job._id.toString());
      expect(result.viewCount).toBe(6);

      // Verify second view
      const result2 = await getPublishedJobBySlug("full-stack-lead");
      expect(result2.viewCount).toBe(7);
    });

    it("throws NotFoundError when job is in DRAFT or ARCHIVED status", async () => {
      await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Secret Draft Job",
        slug: "secret-draft-job",
        description: "Not yet published.",
        categoryId: engineeringCategory,
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "MID",
        skills: ["TypeScript"],
        salaryMin: 90000,
        salaryMax: 120000,
        status: "DRAFT",
      });

      await expect(getPublishedJobBySlug("secret-draft-job")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getPublicCompanyBySlug", () => {
    it("returns company profile and only its published jobs", async () => {
      await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Active Job 1",
        slug: "active-job-1",
        description: "Published opening.",
        categoryId: engineeringCategory,
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "MID",
        skills: ["TypeScript"],
        salaryMin: 100000,
        salaryMax: 120000,
        status: "PUBLISHED",
        publishedAt: new Date(),
      });

      await Job.create({
        employerId: employerA,
        companyId: companyA,
        title: "Hidden Draft Job",
        slug: "hidden-draft-job",
        description: "Draft opening.",
        categoryId: engineeringCategory,
        type: "FULL_TIME",
        locationType: "REMOTE",
        location: "Remote",
        experienceLevel: "MID",
        skills: ["TypeScript"],
        salaryMin: 100000,
        salaryMax: 120000,
        status: "DRAFT",
      });

      const companyData = await getPublicCompanyBySlug("techcorp");
      expect(companyData.company.name).toBe("TechCorp");
      expect(companyData.jobs.length).toBe(1);
      expect(companyData.jobs[0].title).toBe("Active Job 1");
    });
  });
});
