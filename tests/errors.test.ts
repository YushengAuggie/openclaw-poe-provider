import { describe, it, expect } from "vitest";
import {
  emptyResponseError,
  noMediaUrlError,
  downloadError,
  notConfiguredError,
  wrapError,
  ErrorCodes,
} from "../src/errors.js";
import { PoeApiError } from "../src/client.js";

describe("Error factories", () => {
  describe("emptyResponseError", () => {
    it("creates error with correct code", () => {
      const err = emptyResponseError("Image", "imagen-4");
      expect(err).toBeInstanceOf(PoeApiError);
      expect(err.poeErrorCode).toBe(ErrorCodes.EMPTY_RESPONSE);
      expect(err.message).toContain("Image");
      expect(err.message).toContain("imagen-4");
    });
  });

  describe("noMediaUrlError", () => {
    it("creates error with truncated response snippet", () => {
      const longResponse = "A".repeat(500);
      const err = noMediaUrlError("Image", "imagen-4", longResponse);
      expect(err.message.length).toBeLessThan(400); // truncated
      expect(err.poeErrorCode).toBe(ErrorCodes.NO_MEDIA_URL);
    });

    it("redacts long tokens in response snippet", () => {
      const tokenLike = "abc123def456ghi789jkl012mno345pqr678stu";
      const err = noMediaUrlError("Image", "test", `Token: ${tokenLike}`);
      expect(err.message).toContain("[REDACTED]");
      expect(err.message).not.toContain(tokenLike);
    });
  });

  describe("downloadError", () => {
    it("strips query params from URL", () => {
      const err = downloadError(
        "image",
        "https://cdn.example.com/base/image/abc?token=secret&key=123",
        "timeout",
      );
      expect(err.message).not.toContain("secret");
      expect(err.message).not.toContain("key=123");
      expect(err.message).toContain("/base/image/abc");
      expect(err.isRetryable).toBe(true);
    });
  });

  describe("notConfiguredError", () => {
    it("includes setup instructions", () => {
      const err = notConfiguredError();
      expect(err.message).toContain("POE_API_KEY");
      expect(err.message).toContain("poe.com/api_key");
      expect(err.statusCode).toBe(401);
    });
  });

  describe("wrapError", () => {
    it("passes through PoeApiError unchanged", () => {
      const original = new PoeApiError("test", 429, "rate_limit", true);
      const wrapped = wrapError(original, "context");
      expect(wrapped).toBe(original);
    });

    it("wraps generic Error", () => {
      const err = wrapError(new Error("fetch failed"), "Image gen");
      expect(err).toBeInstanceOf(PoeApiError);
      expect(err.message).toContain("Image gen");
      expect(err.message).toContain("fetch failed");
    });

    it("wraps string errors", () => {
      const err = wrapError("something broke", "Video gen");
      expect(err.message).toContain("something broke");
    });

    it("sanitizes API key-like content", () => {
      const err = wrapError(
        new Error("Failed with key=sk-abc123secret token: Bearer xyz"),
        "test",
      );
      expect(err.message).not.toContain("sk-abc123secret");
    });
  });
});
