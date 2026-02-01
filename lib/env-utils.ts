/**
 * Utility functions for cleaning environment variables
 * Removes newlines, carriage returns, and invalid characters
 */

export function cleanEnvVar(value: string | undefined): string | undefined {
  if (!value) return undefined
  // Remove all newlines, carriage returns, and normalize whitespace
  let cleaned = value.trim().replace(/\n/g, '').replace(/\r/g, '').replace(/\s+/g, ' ')
  // Remove any characters that are invalid in HTTP headers (control characters, etc.)
  // Keep only printable ASCII characters (32-126) except for some special cases
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
  // Remove any leading/trailing whitespace again after cleaning
  return cleaned.trim()
}
