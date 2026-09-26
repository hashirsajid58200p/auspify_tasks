import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { SeekerProfile } from "@/server/models/seeker-profile";
import { getSeekerProfile, upsertSeekerProfile } from "@/server/services/profiles";
import { seekerProfileSchema } from "@/validations/profile";

describe("Seeker Profile Service & Validation", () => {
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
    await SeekerProfile.deleteMany({});
  });

  describe("Validation schema", () => {
    it("should accept valid profile data with https links", () => {
      const input = {
        headline: "Senior Full Stack Engineer",
        bio: "Specializing in React, TypeScript, and Node.js with 6 years experience.",
        skills: ["React", "TypeScript", "Node.js"],
        experienceYears: 6,
        location: "San Francisco, CA",
        links: {
          linkedin: "https://linkedin.com/in/testuser",
          github: "https://github.com/testuser",
          portfolio: "https://testuser.dev",
          resumeUrl: "https://storage.googleapis.com/resumes/test.pdf",
        },
      };

      const parsed = seekerProfileSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    });

    it("should reject non-https links", () => {
      const input = {
        headline: "Developer",
        links: {
          linkedin: "http://linkedin.com/in/insecure",
        },
      };

      const parsed = seekerProfileSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });

    it("should reject more than 15 skills", () => {
      const input = {
        skills: Array.from({ length: 16 }, (_, i) => `Skill${i}`),
      };

      const parsed = seekerProfileSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });
  });

  describe("Profile Service operations", () => {
    it("should return null when seeker profile does not exist", async () => {
      const userId = new Types.ObjectId().toString();
      const profile = await getSeekerProfile(userId);
      expect(profile).toBeNull();
    });

    it("should create profile and sanitize / deduplicate skills", async () => {
      const userId = new Types.ObjectId().toString();
      const profile = await upsertSeekerProfile(userId, {
        headline: "Frontend Specialist",
        bio: "Passionate about accessible UI and design systems.",
        skills: ["React", "  react  ", "TypeScript", "REACT", "Next.js"],
        experienceYears: 4,
        location: "New York, NY",
        links: {
          github: "https://github.com/frontenddev",
        },
      });

      expect(profile).toBeDefined();
      expect(profile.headline).toBe("Frontend Specialist");
      expect(profile.skills).toEqual(["React", "TypeScript", "Next.js"]);
      expect(profile.experienceYears).toBe(4);
      expect(profile.links.github).toBe("https://github.com/frontenddev");
    });

    it("should update existing profile smoothly without creating duplicates", async () => {
      const userId = new Types.ObjectId().toString();

      await upsertSeekerProfile(userId, {
        headline: "Junior Dev",
        skills: ["HTML", "CSS"],
      });

      const updated = await upsertSeekerProfile(userId, {
        headline: "Mid-level Dev",
        skills: ["HTML", "CSS", "JavaScript"],
        experienceYears: 2,
      });

      expect(updated.headline).toBe("Mid-level Dev");
      expect(updated.skills).toEqual(["HTML", "CSS", "JavaScript"]);
      expect(updated.experienceYears).toBe(2);

      const count = await SeekerProfile.countDocuments({ userId: new Types.ObjectId(userId) });
      expect(count).toBe(1);
    });
  });
});
