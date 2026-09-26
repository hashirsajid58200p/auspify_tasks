import mongoose from "mongoose";
import { apiHandler } from "@/server/http";
import { Session } from "@/server/models/session";
import { connectToDatabase } from "@/server/db";
import { getRefreshTokenFromRequest } from "@/server/auth/cookies";
import { verifyRefreshToken } from "@/server/auth/tokens";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user, req }) => {
    await connectToDatabase();
    const userObjectId = new mongoose.Types.ObjectId(user!.userId);

    let currentFamilyId: string | undefined;
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) {
      try {
        const payload = await verifyRefreshToken(refreshToken);
        currentFamilyId = payload.familyId;
      } catch {
        // Ignore unparseable or expired refresh token
      }
    }

    const sessions = await Session.find({
      userId: userObjectId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ lastUsedAt: -1 });

    const data = sessions.map((s) => ({
      id: s._id.toString(),
      familyId: s.familyId,
      userAgent: s.userAgent || "Unknown Browser / Client",
      ipHash: s.ipHash || "Hidden",
      createdAt: s.createdAt.toISOString(),
      lastUsedAt: s.lastUsedAt.toISOString(),
      isCurrent: s.familyId === currentFamilyId,
    }));

    return {
      data,
    };
  }
);
