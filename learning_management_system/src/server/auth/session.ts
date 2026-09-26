import crypto from "crypto";
import { Types } from "mongoose";
import { Session, ISession } from "@/server/models/session";
import { User, IUser, UserRole, UserStatus } from "@/server/models/user";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./tokens";
import { getAccessTokenFromRequest } from "./cookies";
import { connectToDatabase } from "@/server/db";
import { UnauthorizedError, ForbiddenError } from "@/server/http";

const GRACE_WINDOW_MS = 10 * 1000; // 10 seconds grace window for concurrent browser tabs

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    isDemo: boolean;
  };
}

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  isDemo: boolean;
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
    userAgent: meta?.userAgent || null,
    ipHash: meta?.ipHash || null,
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
      role: user.role,
      status: user.status,
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
    throw new UnauthorizedError("Session not found");
  }

  // Check if session was already revoked
  if (session.revokedAt) {
    const timeSinceRevocation = Date.now() - session.revokedAt.getTime();
    if (timeSinceRevocation > GRACE_WINDOW_MS) {
      // Replay attack / reuse detected outside grace window: revoke entire session family!
      await Session.updateMany(
        { familyId: session.familyId, revokedAt: null },
        { revokedAt: new Date() }
      );
      throw new UnauthorizedError("Token reuse detected. Session terminated.");
    }

    // Inside grace window: return current active tokens for replaced JTI if available
    if (session.replacedByJti) {
      const activeSession = await Session.findOne({ jti: session.replacedByJti });
      if (activeSession && !activeSession.revokedAt) {
        const user = await User.findById(session.userId);
        if (!user) throw new UnauthorizedError("User not found");
        if (user.status === "SUSPENDED") {
          throw new ForbiddenError("Account suspended. Access denied.");
        }

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
            role: user.role,
            status: user.status,
            isDemo: user.isDemo,
          },
        };
      }
    }
  }

  // Active session rotation
  const user = await User.findById(session.userId);
  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  if (user.status === "SUSPENDED") {
    // Revoke all sessions for suspended user
    await Session.updateMany(
      { userId: user._id, revokedAt: null },
      { revokedAt: new Date() }
    );
    throw new ForbiddenError("Account suspended. Access denied.");
  }

  const newJti = crypto.randomUUID();
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Mark old session as revoked and record replacement JTI
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
      role: user.role,
      status: user.status,
      isDemo: user.isDemo,
    },
  };
}

export async function revokeSessionByJti(jti: string): Promise<void> {
  await connectToDatabase();
  const session = await Session.findOne({ jti });
  if (session) {
    await Session.updateMany(
      { familyId: session.familyId, revokedAt: null },
      { revokedAt: new Date() }
    );
  }
}

export async function revokeAllUserSessions(
  userId: string | Types.ObjectId,
  exceptFamilyId?: string
): Promise<void> {
  await connectToDatabase();
  const query: { userId: string | Types.ObjectId; revokedAt: null; familyId?: { $ne: string } } = {
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
    throw new UnauthorizedError("Unauthorized: Missing access token");
  }

  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Unauthorized: Invalid or expired access token");
  }

  await connectToDatabase();

  // Role and status verified against database on every request (rule 2 & 8)
  const user = await User.findById(payload.sub)
    .select("_id email name role status isDemo")
    .lean();

  if (!user) {
    throw new UnauthorizedError("User account not found");
  }

  if (user.status === "SUSPENDED") {
    throw new ForbiddenError("Account suspended. Access denied.");
  }

  return {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    isDemo: user.isDemo,
  };
}
