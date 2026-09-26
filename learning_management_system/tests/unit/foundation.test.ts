import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";

describe("Foundation & Utilities", () => {
  it("merges tailwind class names properly", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("loads environment configuration with valid defaults", () => {
    expect(env.NEXT_PUBLIC_APP_URL).toBeDefined();
    expect(env.MONGODB_DB).toBe("lms");
  });
});
