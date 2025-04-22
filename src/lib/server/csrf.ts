// src/lib/server/csrf.ts
import { dev } from '$app/environment';
import crypto from 'crypto';

// Secret key for CSRF tokens (use environment variables in production)
const SECRET = dev ? 'dev-secret-key' : process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Generate a CSRF token
 * @returns CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a CSRF token with HMAC signature
 * @returns Object containing token and signature
 */
export function createCsrfToken(): { token: string, signature: string } {
  const token = generateCsrfToken();
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(token)
    .digest('hex');
  
  return { token, signature };
}

/**
 * Validate a CSRF token against its signature
 * @param token CSRF token
 * @param signature HMAC signature
 * @returns Boolean indicating if token is valid
 */
export function validateCsrfToken(token: string, signature: string): boolean {
  if (!token || !signature) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(token)
    .digest('hex');
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
}