import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Cryptographic & Security Utility Functions
 */

// BCRYPT Cost Factor (Minimum 12 for OWASP ASVS compliance)
const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes plain text password securely using Bcrypt (or Argon2id in native environment)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return await bcrypt.hash(password, salt);
}

/**
 * Verifies plain password against stored hash with timing-attack prevention
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generates a 6-digit cryptographically secure numeric OTP
 */
export function generateSecureOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Hashes arbitrary string (e.g., OTP or Refresh Token) using SHA-256
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a high-entropy random hex token
 */
export function generateRandomSecret(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Performs timing-safe string comparison to prevent timing attacks
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
