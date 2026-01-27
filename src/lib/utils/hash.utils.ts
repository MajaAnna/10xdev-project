import crypto from "crypto";

/**
 * Calculates MD5 hash for the given text
 *
 * Used to:
 * - Store a privacy-preserving identifier of source text
 * - Enable deduplication of generation requests
 * - Provide analytics without storing full text
 *
 * @param text - The text to hash
 * @returns Hexadecimal string representation of the MD5 hash
 *
 * @example
 * ```typescript
 * const hash = calculateMD5Hash("Hello, world!");
 * // Returns: "6cd3556deb0da54bca060b4c39479839"
 * ```
 */
export function calculateMD5Hash(text: string): string {
  return crypto.createHash("md5").update(text, "utf8").digest("hex");
}
