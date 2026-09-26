import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Company } from "@/server/models/company";
import { User } from "@/server/models/user";
import {
  getEmployerCompany,
  upsertEmployerCompany,
  getCompanyBySlug,
} from "@/server/services/companies";
import { isValidLogoUrl, isValidHttpsUrl } from "@/validations/company";
import { NotFoundError } from "@/server/http";

describe("Company Service & Profiles", () => {
  let mongoServer: MongoMemoryServer;

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
    await Company.deleteMany({});
    await User.deleteMany({});
  });

  describe("Logo & URL Validation Helpers", () => {
    it("should allow valid https URLs on allowlisted logo hosts", () => {
      expect(isValidLogoUrl("https://images.unsplash.com/photo-1234")).toBe(true);
      expect(isValidLogoUrl("https://res.cloudinary.com/demo/image/upload/sample.jpg")).toBe(true);
      expect(isValidLogoUrl("https://dummyimage.com/120x120/000/fff")).toBe(true);
      expect(isValidLogoUrl("https://placehold.co/600x400")).toBe(true);
      expect(isValidLogoUrl("")).toBe(true); // optional empty logo
    });

    it("should reject unapproved image hosts or non-https URLs", () => {
      expect(isValidLogoUrl("http://images.unsplash.com/photo-1234")).toBe(false); // http rejected
      expect(isValidLogoUrl("https://malicious-site.com/image.png")).toBe(false);
      expect(isValidLogoUrl("ftp://images.unsplash.com/photo")).toBe(false);
    });

    it("should validate website URLs as https", () => {
      expect(isValidHttpsUrl("https://acme.org")).toBe(true);
      expect(isValidHttpsUrl("http://acme.org")).toBe(false);
      expect(isValidHttpsUrl("")).toBe(true);
    });
  });

  describe("Company Profile Lifecycle", () => {
    it("should create a new company for an employer and generate unique slug", async () => {
      const employerId = new Types.ObjectId().toString();

      const company = await upsertEmployerCompany(employerId, {
        name: "Acme Innovations",
        description: "Leading the future of cloud computing with modern developer tooling.",
        location: "San Francisco, CA",
        industry: "Software",
        size: "51-200",
        website: "https://acme.org",
        logoUrl: "https://images.unsplash.com/photo-1",
      });

      expect(company).toBeDefined();
      expect(company.name).toBe("Acme Innovations");
      expect(company.slug.startsWith("acme-innovations-")).toBe(true);
      expect(company.ownerId.toString()).toBe(employerId);

      const found = await getEmployerCompany(employerId);
      expect(found).toBeDefined();
      expect(found?._id.toString()).toBe(company._id.toString());
    });

    it("should enforce one company per employer by updating existing on second call", async () => {
      const employerId = new Types.ObjectId().toString();

      const first = await upsertEmployerCompany(employerId, {
        name: "Initial Name",
        description: "Initial description that is sufficiently long for validation.",
        location: "Boston, MA",
        industry: "Fintech",
        size: "11-50",
      });

      const updated = await upsertEmployerCompany(employerId, {
        name: "Updated Name",
        description: "Updated description that is sufficiently long for validation.",
        location: "New York, NY",
        industry: "Fintech",
        size: "51-200",
      });

      expect(updated._id.toString()).toBe(first._id.toString());
      expect(updated.name).toBe("Updated Name");
      expect(updated.location).toBe("New York, NY");

      const totalCompanies = await Company.countDocuments({ ownerId: employerId });
      expect(totalCompanies).toBe(1);
    });

    it("should find company by slug or throw NotFoundError", async () => {
      const employerId = new Types.ObjectId().toString();
      const created = await upsertEmployerCompany(employerId, {
        name: "Slug Search Co",
        description: "Sufficiently long description for the company profile test.",
        location: "Remote",
        industry: "Design",
        size: "1-10",
      });

      const found = await getCompanyBySlug(created.slug);
      expect(found._id.toString()).toBe(created._id.toString());

      await expect(getCompanyBySlug("non-existent-slug")).rejects.toThrow(NotFoundError);
    });
  });
});
