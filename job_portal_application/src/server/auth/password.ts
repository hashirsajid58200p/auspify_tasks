import { hash, verify } from "@node-rs/argon2";

// Argon2id options matching production security recommendations
const HASH_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

// Pre-computed dummy argon2id hash to mitigate timing attacks on unknown email
let cachedDummyHash: string | null = null;

async function getDummyHash(): Promise<string> {
  if (!cachedDummyHash) {
    cachedDummyHash = await hash("dummy-timing-password", HASH_OPTIONS);
  }
  return cachedDummyHash;
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8 || password.length > 128) {
    throw new Error("Password must be between 8 and 128 characters");
  }
  return hash(password, HASH_OPTIONS);
}

export async function verifyPassword(
  hashedPassword: string,
  plainPassword: string,
): Promise<boolean> {
  try {
    return await verify(hashedPassword, plainPassword);
  } catch {
    return false;
  }
}

export async function verifyDummyPassword(plainPassword: string): Promise<boolean> {
  const dummyHash = await getDummyHash();
  try {
    await verify(dummyHash, plainPassword);
  } catch {
    // ignore
  }
  return false;
}
