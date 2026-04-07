/**
 * Centralized error handling with user-facing messages.
 *
 * Reviewer feedback addressed:
 * - Security: Never log API keys in error messages
 * - UX/UI/Normal User: Human-readable errors with billing context
 * - UI: Explicit error state copy for each failure mode
 * - Claude Code review: Consistent error types (validation = 400, not 500)
 */

import { PoeApiError } from "./client.js";

/** Error codes used across the plugin. */
export const ErrorCodes = {
  EMPTY_RESPONSE: "EMPTY_RESPONSE",
  NO_MEDIA_URL: "NO_MEDIA_URL",
  DOWNLOAD_FAILED: "DOWNLOAD_FAILED",
  INVALID_MODEL: "INVALID_MODEL",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

/**
 * Create a user-friendly error for when a media bot returns no content.
 */
export function emptyResponseError(
  botType: string,
  model: string,
): PoeApiError {
  return new PoeApiError(
    `Empty response from ${botType} bot "${model}". ` +
      `The bot may be temporarily unavailable or doesn't support this request.`,
    500,
    ErrorCodes.EMPTY_RESPONSE,
  );
}

/**
 * Create a user-friendly error for when a media bot returns text but no media URL.
 */
export function noMediaUrlError(
  botType: string,
  model: string,
  responseSnippet: string,
): PoeApiError {
  // Truncate and sanitize the response snippet (never include full response)
  const sanitized = responseSnippet
    .substring(0, 200)
    .replace(/[A-Za-z0-9_-]{20,}/g, "[REDACTED]"); // Redact tokens (incl. hyphens/underscores)

  return new PoeApiError(
    `${botType} bot "${model}" returned no ${botType.toLowerCase()} URL. ` +
      `Response preview: ${sanitized}`,
    500,
    ErrorCodes.NO_MEDIA_URL,
  );
}

/**
 * Create a user-friendly error for media download failures.
 */
export function downloadError(
  mediaType: string,
  url: string,
  cause?: string,
): PoeApiError {
  // Never include full URL in user-facing errors (could contain tokens)
  const safeUrl = url.split("?")[0]; // Strip query params
  return new PoeApiError(
    `Failed to download ${mediaType} from Poe CDN. URL: ${safeUrl}${cause ? `. Cause: ${cause}` : ""}`,
    502,
    ErrorCodes.DOWNLOAD_FAILED,
    true, // retryable
  );
}

/**
 * Create a user-friendly error for when the plugin is not configured.
 */
export function notConfiguredError(): PoeApiError {
  return new PoeApiError(
    "Poe provider not configured. Set POE_API_KEY environment variable. " +
      "Get your key at poe.com/api_key",
    401,
    ErrorCodes.NOT_CONFIGURED,
  );
}

/**
 * Create a 400-class validation error (prompt too short, empty text, etc.)
 */
export function validationError(message: string): PoeApiError {
  return new PoeApiError(message, 400, ErrorCodes.VALIDATION_ERROR, false);
}

/**
 * Wrap an unknown error into a PoeApiError with safe messaging.
 * Used in catch blocks to ensure consistent error types.
 */
export function wrapError(err: unknown, context: string): PoeApiError {
  if (err instanceof PoeApiError) return err;

  const message =
    err instanceof Error ? err.message : String(err);

  // Sanitize: remove anything that looks like an API key or bearer token
  const sanitized = message.replace(
    /(?:key|token|auth|bearer)[=:\s]+\S+/gi,
    "[REDACTED]",
  );

  return new PoeApiError(
    `${context}: ${sanitized}`,
    500,
    undefined,
    false,
  );
}
