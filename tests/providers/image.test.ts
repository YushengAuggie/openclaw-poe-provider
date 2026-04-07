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
      "no image URLs",
    );
  });
});
