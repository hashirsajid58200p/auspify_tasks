import { RateLimit } from "@/server/models/rate-limit";
import { connectToDatabase } from "@/server/db";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

export async function checkRateLimit(
  key: string,
  maxPoints: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  await connectToDatabase();

  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  // Atomic upsert with $inc
  const record = await RateLimit.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { resetAt },
    },
    {
      returnDocument: "after",
      upsert: true,
    },
  );

  const remaining = Math.max(0, maxPoints - (record?.count || 1));
  const resetInSeconds = Math.max(
    0,
    Math.ceil(((record?.resetAt || resetAt).getTime() - Date.now()) / 1000),
  );

  if ((record?.count || 1) > maxPoints) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  return {
    allowed: true,
    remaining,
    resetInSeconds,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
