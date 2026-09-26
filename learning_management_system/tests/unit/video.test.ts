import { describe, it, expect } from "vitest";
import { parseVideoUrl, isValidVideoUrl } from "@/lib/video";

describe("Video URL Parser & Allowlist", () => {
  describe("YouTube URLs", () => {
    it("should parse standard youtube.com/watch?v=... URLs", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const result = parseVideoUrl(url);

      expect(result).not.toBeNull();
      expect(result?.platform).toBe("YOUTUBE");
      expect(result?.videoId).toBe("dQw4w9WgXcQ");
      expect(result?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    });

    it("should parse shortened youtu.be/... URLs", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ";
      const result = parseVideoUrl(url);

      expect(result).not.toBeNull();
      expect(result?.platform).toBe("YOUTUBE");
      expect(result?.videoId).toBe("dQw4w9WgXcQ");
      expect(result?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    });

    it("should parse youtube embed URLs", () => {
      const url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
      const result = parseVideoUrl(url);

      expect(result).not.toBeNull();
      expect(result?.videoId).toBe("dQw4w9WgXcQ");
      expect(result?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    });
  });

  describe("Vimeo URLs", () => {
    it("should parse standard vimeo.com/... URLs", () => {
      const url = "https://vimeo.com/76979871";
      const result = parseVideoUrl(url);

      expect(result).not.toBeNull();
      expect(result?.platform).toBe("VIMEO");
      expect(result?.videoId).toBe("76979871");
      expect(result?.embedUrl).toBe("https://player.vimeo.com/video/76979871");
    });

    it("should parse player.vimeo.com/video/... URLs", () => {
      const url = "https://player.vimeo.com/video/76979871";
      const result = parseVideoUrl(url);

      expect(result).not.toBeNull();
      expect(result?.platform).toBe("VIMEO");
      expect(result?.videoId).toBe("76979871");
    });
  });

  describe("Security & Rejections", () => {
    it("should reject non-HTTPS URLs", () => {
      expect(parseVideoUrl("http://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
      expect(parseVideoUrl("http://vimeo.com/76979871")).toBeNull();
    });

    it("should reject unsupported video domains", () => {
      expect(parseVideoUrl("https://www.dailymotion.com/video/x7tgad0")).toBeNull();
      expect(parseVideoUrl("https://tiktok.com/@user/video/123456789")).toBeNull();
      expect(parseVideoUrl("https://evil.com/video.mp4")).toBeNull();
    });

    it("should reject raw HTML and iframe tags", () => {
      expect(parseVideoUrl('<iframe src="https://youtube.com"></iframe>')).toBeNull();
      expect(parseVideoUrl("javascript:alert(1)")).toBeNull();
    });

    it("should reject malformed video IDs", () => {
      expect(parseVideoUrl("https://www.youtube.com/watch?v=too-short")).toBeNull();
      expect(parseVideoUrl("https://vimeo.com/not-a-number")).toBeNull();
    });

    it("isValidVideoUrl helper reflects validation correctly", () => {
      expect(isValidVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
      expect(isValidVideoUrl("https://google.com")).toBe(false);
    });
  });
});
