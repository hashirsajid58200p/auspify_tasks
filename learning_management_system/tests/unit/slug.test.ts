import { describe, it, expect } from "vitest";
import { slugify, generateCourseSlug } from "@/lib/slug";

describe("Slug Generator Utility", () => {
  it("should convert titles into lowercase, hyphenated strings", () => {
    expect(slugify("Next.js 16 Full-Stack Course")).toBe("nextjs-16-full-stack-course");
    expect(slugify("  Hello   World!  ")).toBe("hello-world");
  });

  it("should strip accent characters and non-alphanumeric punctuation", () => {
    expect(slugify("Crème Brûlée & Café")).toBe("creme-brulee-cafe");
    expect(slugify("Special @#$% Characters*()")).toBe("special-characters");
  });

  it("should generate unique course slugs by appending a random suffix", () => {
    const slug1 = generateCourseSlug("Building Modern APIs");
    const slug2 = generateCourseSlug("Building Modern APIs");

    expect(slug1.startsWith("building-modern-apis-")).toBe(true);
    expect(slug2.startsWith("building-modern-apis-")).toBe(true);
    expect(slug1).not.toBe(slug2); // Unique random suffixes
  });
});
