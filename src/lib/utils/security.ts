// src/lib/utils/security.ts
import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * @param input User-supplied string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
}

/**
 * Validate input against a specific pattern
 * @param input User-supplied string
 * @param pattern Regex pattern to validate against
 * @returns Boolean indicating if input is valid
 */
export function validatePattern(input: string, pattern: RegExp): boolean {
  return pattern.test(input);
}

/**
 * Escape special characters in SQL strings to prevent SQL injection
 * @param input User-supplied string
 * @returns Escaped string safe for SQL
 */
export function escapeSql(input: string): string {
  if (!input) return '';
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, "\\\\");
}