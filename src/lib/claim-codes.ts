import bcrypt from "bcryptjs";

/**
 * WS-3 claim-code security — pure, unit-testable helpers.
 *
 * Claim codes are admin-issued secrets that verify listing ownership when a
 * migrated provider claims their account (placeholder emails can't receive
 * mail, so a code delivered out-of-band is the verification channel).
 *
 * Invariants:
 * - Plaintext codes are NEVER stored — only the bcrypt hash.
 * - Codes are single-use: cleared from the user row on a successful claim.
 * - Codes expire after CLAIM_CODE_TTL_MS.
 * - MAX_CLAIM_ATTEMPTS failed tries arm a CLAIM_LOCK_MS lockout.
 */

export const CLAIM_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const MAX_CLAIM_ATTEMPTS = 5;
export const CLAIM_LOCK_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Uniform error returned for EVERY claim failure that must not reveal state
 * (unknown email, wrong role, missing/wrong/expired code, no provider link).
 * Only the lockout case differs (see CLAIM_LOCKOUT_ERROR + 429).
 */
export const UNIFORM_CLAIM_ERROR =
  "Unable to claim this provider listing. Check the details and try again.";

/** Returned with HTTP 429 when the claim attempt lock is active. */
export const CLAIM_LOCKOUT_ERROR = "Too many attempts. Try again in 15 minutes.";

/**
 * Unambiguous alphabet: no 0/O/1/I/l (easy to misread over WhatsApp/phone).
 * 32 chars → log2(32) = 5 bits of entropy per char; 12 chars ≈ 60 bits.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_GROUPS = 3;
const CODE_GROUP_LENGTH = 4;
const BCRYPT_ROUNDS = 10;

/** Generate a 12-character claim code, e.g. "K7XQ-M2NP-V8RT". */
export function generateClaimCode(): string {
  const groups: string[] = [];
  for (let g = 0; g < CODE_GROUPS; g++) {
    let group = "";
    for (let i = 0; i < CODE_GROUP_LENGTH; i++) {
      group += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    groups.push(group);
  }
  return groups.join("-");
}

export interface ClaimCodeFields {
  /** Plaintext code — return it to the caller (admin UI / migration CSV) only. */
  claimCode: string;
  /** bcrypt hash — the ONLY thing persisted. */
  claimCodeHash: string;
  claimCodeExpiresAt: Date;
  claimAttempts: 0;
  claimLockedUntil: null;
}

/**
 * Generate + hash a fresh claim code and return the fields to persist.
 * The dbUser argument is accepted for signature compatibility with callers
 * that hold the user row; generation itself needs nothing from it.
 */
export async function setClaimCode(_dbUser?: unknown): Promise<ClaimCodeFields> {
  void _dbUser; // reserved: callers hold the user row; generation needs nothing from it
  const claimCode = generateClaimCode();
  const claimCodeHash = await bcrypt.hash(claimCode, BCRYPT_ROUNDS);
  return {
    claimCode,
    claimCodeHash,
    claimCodeExpiresAt: new Date(Date.now() + CLAIM_CODE_TTL_MS),
    claimAttempts: 0,
    claimLockedUntil: null,
  };
}

/**
 * Replace an existing claim code with a fresh one. Identical mechanics to
 * setClaimCode — the new hash overwrites the old, so the previous code is
 * invalidated immediately. Also resets attempts/lock state.
 */
export async function regenerateClaimCode(
  _dbUser?: unknown
): Promise<ClaimCodeFields> {
  void _dbUser; // reserved: same signature as setClaimCode for interchangeability
  return setClaimCode();
}

/**
 * Verify a plaintext code against the stored bcrypt hash.
 * Null hash (no code issued, or code already used) → false.
 */
export async function verifyClaimCode(
  dbUser: { claimCodeHash: string | null },
  plaintextCode: string
): Promise<boolean> {
  if (!dbUser.claimCodeHash) return false;
  return bcrypt.compare(plaintextCode, dbUser.claimCodeHash);
}

/** True while the 15-minute lockout is active. */
export function isClaimLocked(
  dbUser: { claimLockedUntil: Date | null },
  now: Date = new Date()
): boolean {
  return dbUser.claimLockedUntil != null && dbUser.claimLockedUntil > now;
}

/** True when a code exists but has passed its 7-day expiry. */
export function isClaimCodeExpired(
  dbUser: { claimCodeExpiresAt: Date | null },
  now: Date = new Date()
): boolean {
  return dbUser.claimCodeExpiresAt != null && dbUser.claimCodeExpiresAt <= now;
}

/**
 * Compute the attempt state after one failed verification.
 * The 5th consecutive failure arms the lock; the counter resets to 0 so that
 * once the lock expires the user gets a fresh set of attempts.
 */
export function nextClaimAttempt(
  dbUser: { claimAttempts: number | null },
  now: Date = new Date()
): {
  claimAttempts: number;
  claimLockedUntil: Date | null;
  locked: boolean;
} {
  const attempts = (dbUser.claimAttempts ?? 0) + 1;
  const locked = attempts >= MAX_CLAIM_ATTEMPTS;
  return {
    claimAttempts: locked ? 0 : attempts,
    claimLockedUntil: locked ? new Date(now.getTime() + CLAIM_LOCK_MS) : null,
    locked,
  };
}
