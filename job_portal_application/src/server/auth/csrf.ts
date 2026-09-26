import { env } from "@/lib/env";

export function verifyCsrf(req: Request): { valid: boolean; reason?: string } {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  // 1. Content-Type check
  const contentType = req.headers.get("content-type");
  if (contentType && !contentType.includes("application/json")) {
    return { valid: false, reason: "Invalid Content-Type header. Expected application/json" };
  }

  // 2. Origin / Referer check
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin) {
    const referer = req.headers.get("referer");
    if (!referer) {
      if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
        return { valid: true };
      }
      return { valid: false, reason: "Missing Origin and Referer headers" };
    }

    try {
      const refererUrl = new URL(referer);
      if (host && refererUrl.host !== host) {
        return { valid: false, reason: "Referer origin mismatch" };
      }
    } catch {
      return { valid: false, reason: "Malformed Referer header" };
    }

    return { valid: true };
  }

  try {
    const originUrl = new URL(origin);
    if (host && originUrl.host !== host) {
      const appUrl = new URL(env.NEXT_PUBLIC_APP_URL);
      if (originUrl.host !== appUrl.host) {
        return { valid: false, reason: "Origin header does not match host or app URL" };
      }
    }
  } catch {
    return { valid: false, reason: "Malformed Origin header" };
  }

  return { valid: true };
}
