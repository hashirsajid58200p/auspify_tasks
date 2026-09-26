export type VideoPlatform = "YOUTUBE" | "VIMEO";

export interface ParsedVideoInfo {
  platform: VideoPlatform;
  videoId: string;
  embedUrl: string;
  canonicalUrl: string;
}

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const VIMEO_ID_REGEX = /^\d{6,12}$/;

/**
 * Validates and extracts video metadata from YouTube or Vimeo URLs.
 * Rejects all raw HTML, iframes, and unsupported video hosts.
 * Generates privacy-enhanced embed URLs.
 */
export function parseVideoUrl(input: string): ParsedVideoInfo | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();

  // Reject raw HTML, tags, or scripts immediately
  if (trimmed.includes("<") || trimmed.includes(">") || trimmed.includes("javascript:")) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return null;
  }

  // Must use HTTPS
  if (parsedUrl.protocol !== "https:") {
    return null;
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");

  // 1. YouTube handling
  if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
    let videoId: string | null = null;

    if (parsedUrl.pathname === "/watch") {
      videoId = parsedUrl.searchParams.get("v");
    } else if (parsedUrl.pathname.startsWith("/embed/")) {
      const parts = parsedUrl.pathname.split("/embed/");
      videoId = parts[1]?.split(/[?&#]/)[0] || null;
    } else if (parsedUrl.pathname.startsWith("/v/")) {
      const parts = parsedUrl.pathname.split("/v/");
      videoId = parts[1]?.split(/[?&#]/)[0] || null;
    }

    if (videoId && YOUTUBE_ID_REGEX.test(videoId)) {
      return {
        platform: "YOUTUBE",
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }
  }

  // Short YouTube URL (youtu.be/ID)
  if (hostname === "youtu.be") {
    const videoId = parsedUrl.pathname.slice(1).split(/[?&#]/)[0];
    if (videoId && YOUTUBE_ID_REGEX.test(videoId)) {
      return {
        platform: "YOUTUBE",
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }
  }

  // 2. Vimeo handling
  if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
    let videoId: string | null = null;

    if (hostname === "player.vimeo.com" && parsedUrl.pathname.startsWith("/video/")) {
      const parts = parsedUrl.pathname.split("/video/");
      videoId = parts[1]?.split(/[?&#]/)[0] || null;
    } else {
      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && VIMEO_ID_REGEX.test(lastSegment)) {
        videoId = lastSegment;
      }
    }

    if (videoId && VIMEO_ID_REGEX.test(videoId)) {
      return {
        platform: "VIMEO",
        videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
        canonicalUrl: `https://vimeo.com/${videoId}`,
      };
    }
  }

  return null;
}

export function isValidVideoUrl(input: string): boolean {
  return parseVideoUrl(input) !== null;
}
