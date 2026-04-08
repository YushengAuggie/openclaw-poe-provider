import { describe, it, expect, vi, beforeEach } from "vitest";
import { createImageProvider } from "../../src/providers/image.js";

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("createImageProvider", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("has correct provider id and label", () => {
    const provider = createImageProvider("test-key");
    expect(provider.id).toBe("poe");
    expect(provider.label).toBe("Poe Images");
  });

  it("reports configured when key exists", () => {
    const provider = createImageProvider("test-key");
    expect(provider.isConfigured({})).toBe(true);
  });

  it("reports not configured when key is empty", () => {
    const provider = createImageProvider("");
    expect(provider.isConfigured({})).toBe(false);
  });

  it("has image models from registry", () => {
    const provider = createImageProvider("test-key");
    expect(provider.models!.length).toBeGreaterThan(5);
    expect(provider.models!.some((m) => m.id === "imagen-4")).toBe(true);
  });

  it("generates image from Poe API response", async () => {
    const imageUrl =
      "https://pfst.cf2.poecdn.net/base/image/abc123?w=1024&h=1024";

    // Mock the chat completion call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "chatcmpl-test",
        choices: [
          {
            message: {
              content: `![A cat](${imageUrl})\n\n${imageUrl}`,
            },
          },
        ],
        usage: { prompt_tokens: 5, completion_tokens: 30, total_tokens: 35 },
      }),
    });

    // Mock the image download
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(100),
      headers: new Headers({ "content-type": "image/png" }),
    });

    const provider = createImageProvider("test-key");
    const result = await provider.generate({ prompt: "A cat" });

    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toBe(imageUrl);
    expect(result.images[0].mimeType).toBe("image/png");
  });

  it("throws on empty response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "" } }],
      }),
    });

    const provider = createImageProvider("test-key");
    await expect(provider.generate({ prompt: "test" })).rejects.toThrow(
      "Empty response",
    );
  });

  it("throws when no image URL in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: "Sorry, I cannot generate that image." } },
        ],
      }),
    });

    const provider = createImageProvider("test-key");
    await expect(provider.generate({ prompt: "test" })).rejects.toThrow(
      "no image URL",
    );
  });

  it("graceful degradation when download fails", async () => {
    const imageUrl =
      "https://pfst.cf2.poecdn.net/base/image/failimg123?w=1024&h=1024";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: `![A cat](${imageUrl})`,
            },
          },
        ],
      }),
    });

    // Download fails
    mockFetch.mockRejectedValueOnce(new Error("Download failed"));

    const provider = createImageProvider("test-key");
    const result = await provider.generate({ prompt: "A cat" });

    // Should return URL-only result without buffer
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toBe(imageUrl);
    expect(result.images[0].buffer).toBeUndefined();
  });

  it("respects count parameter", async () => {
    const url1 =
      "https://pfst.cf2.poecdn.net/base/image/img1abc?w=1024&h=1024";
    const url2 =
      "https://pfst.cf2.poecdn.net/base/image/img2def?w=1024&h=1024";
    const url3 =
      "https://pfst.cf2.poecdn.net/base/image/img3ghi?w=1024&h=1024";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: `![img1](${url1})\n![img2](${url2})\n![img3](${url3})`,
            },
          },
        ],
      }),
    });

    // Two download mocks (count=2, so only 2 images processed)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
        headers: new Headers({ "content-type": "image/png" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
        headers: new Headers({ "content-type": "image/png" }),
      });

    const provider = createImageProvider("test-key");
    const result = await provider.generate({ prompt: "cats", count: 2 });

    expect(result.images).toHaveLength(2);
    expect(result.images[0].url).toBe(url1);
    expect(result.images[1].url).toBe(url2);
  });

  it("throws validation error for empty prompt", async () => {
    const provider = createImageProvider("test-key");

    const err: any = await provider
      .generate({ prompt: "" })
      .catch((e: unknown) => e);

    expect(err.statusCode).toBe(400);
    expect(err.message).toContain("prompt cannot be empty");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
