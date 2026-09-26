import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { env } from "@/lib/env";

const ISSUER = "student-management-system";
const AUDIENCE = "studentms-app";
const ALGORITHM = "HS256";

export interface AccessTokenPayload extends JWTPayload {
  sub: string; // userId
  email: string;
  type: "access";
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string; // userId
  jti: string;
  familyId: string;
  type: "refresh";
}

function getAccessSecretKey(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET || env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

function getRefreshSecretKey(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(userId: string, email: string): Promise<string> {
  const secret = getAccessSecretKey();
  return new SignJWT({
    email,
    type: "access",
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("15m")
    .sign(secret);
}

export async function signRefreshToken(
  userId: string,
  jti: string,
  familyId: string,
): Promise<string> {
  const secret = getRefreshSecretKey();
  return new SignJWT({
    familyId,
    type: "refresh",
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const secret = getAccessSecretKey();
  const { payload } = await jwtVerify(token, secret, {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  if (payload.type !== "access" || !payload.sub || typeof payload.email !== "string") {
    throw new Error("Invalid access token claims");
  }

  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const secret = getRefreshSecretKey();
  const { payload } = await jwtVerify(token, secret, {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  if (
    payload.type !== "refresh" ||
    !payload.sub ||
    !payload.jti ||
    typeof payload.familyId !== "string"
  ) {
    throw new Error("Invalid refresh token claims");
  }

  return payload as RefreshTokenPayload;
}
