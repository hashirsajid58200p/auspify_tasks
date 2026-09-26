import crypto from "crypto";
import { Session, ISession } from "@/server/models/session";
import { User, IUser } from "@/server/models/user";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./tokens";
import { getAccessTokenFromRequest } from "./cookies";
import { connectToDatabase } from "@/server/db";

const GRACE_WINDOW_MS = 10 * 1000; // 10 seconds grace window for concurrent browser tabs

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    currency: string;
    isDemo: boolean;
  };
}

export interface CurrentUser {
  userId: string;
  email: string;
}

export async function createSession(
  user: IUser,
  meta?: { userAgent?: string; ipHash?: string; familyId?: string }
): Promise<AuthTokens> {
  await connectToDatabase();

  const familyId = meta?.familyId || crypto.randomUUID();
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await Session.create({
    userId: user._id,
    familyId,
    jti,
    expiresAt,
    userAgent: meta?.userAgent,
    ipHash: meta?.ipHash,
    lastUsedAt: new Date(),
  });

  const accessToken = await signAccessToken(user._id.toString(), user.email);
  const refreshToken = await signRefreshToken(user._id.toString(), jti, familyId);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      currency: user.currency,
      isDemo: user.isDemo,
    },
  };
}

export async function rotateSession(
  oldRefreshToken: string,
  meta?: { userAgent?: string; ipHash?: string }
): Promise<AuthTokens> {
  await connectToDatabase();

  const payload = await verifyRefreshToken(oldRefreshToken);
  const session = await Session.findOne({ jti: payload.jti });

  if (!session) {
    throw new Error("Session not found");
  }

  // Check if session was revoked
  if (session.revokedAt) {
    const timeSinceRevocation = Date.now() - session.revokedAt.getTime();
    if (timeSinceRevocation > GRACE_WINDOW_MS) {
      // Replay attack / reuse detected outside grace window: revoke entire family!
      await Session.updateMany(
        { familyId: session.familyId, revokedAt: null },
        { revokedAt: new Date() }
      );
      throw new Error("Token reuse detected. Family revoked.");
    }

    // Inside grace window: return current active tokens for the replaced JTI if available
    if (session.replacedByJti) {
      const activeSession = await Session.findOne({ jti: session.replacedByJti });
      if (activeSession && !activeSession.revokedAt) {
        const user = await User.findById(session.userId);
        if (!user) throw new Error("User not found");

        const accessToken = await signAccessToken(user._id.toString(), user.email);
        const refreshToken = await signRefreshToken(
          user._id.toString(),
          activeSession.jti,
          activeSession.familyId
        );

        return {
          accessToken,
          refreshToken,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            currency: user.currency,
            isDemo: user.isDemo,
          },
        };
      }
    }
  }

  // Active session rotation
  const user = await User.findById(session.userId);
  if (!user) {
    throw new Error("User not found");
  }

  const newJti = crypto.randomUUID();
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Mark old session as revoked and record replacement
  session.revokedAt = new Date();
  session.replacedByJti = newJti;
  await session.save();

  // Create new session in same family
  await Session.create({
    userId: user._id,
    familyId: session.familyId,
    jti: newJti,
    expiresAt: newExpiresAt,
    userAgent: meta?.userAgent || session.userAgent,
    ipHash: meta?.ipHash || session.ipHash,
    lastUsedAt: new Date(),
  });

  const accessToken = await signAccessToken(user._id.toString(), user.email);
  const refreshToken = await signRefreshToken(user._id.toString(), newJti, session.familyId);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      currency: user.currency,
      isDemo: user.isDemo,
    },
  };
}

export async function revokeSessionByJti(jti: string): Promise<void> {
  await connectToDatabase();
  const session = await Session.findOne({ jti });
  if (session) {
    // Revoke the family
    await Session.updateMany(
      { familyId: session.familyId, revokedAt: null },
      { revokedAt: new Date() }
    );
  }
}

export async function revokeAllUserSessions(
  userId: string,
  exceptFamilyId?: string
): Promise<void> {
  await connectToDatabase();
  const query: { userId: string; revokedAt: null; familyId?: { $ne: string } } = {
    userId,
    revokedAt: null,
  };
  if (exceptFamilyId) {
    query.familyId = { $ne: exceptFamilyId };
  }
  await Session.updateMany(query, { revokedAt: new Date() });
}

export async function requireUser(req: Request): Promise<CurrentUser> {
  const token = getAccessTokenFromRequest(req);
  if (!token) {
    throw new Error("Unauthorized: Missing access token");
  }

  try {
    const payload = await verifyAccessToken(token);
    return {
      userId: payload.sub,
      email: payload.email,
    };
  } catch {
    throw new Error("Unauthorized: Invalid or expired access token");
  }
}
