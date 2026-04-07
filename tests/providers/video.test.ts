import { describe, it, expect, vi, beforeEach } from "vitest";
import { createVideoProvider } from "../../src/providers/video.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("createVideoProvider", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("has correct provider id and label", () => {
    const provider = createVideoProvider("test-key");
    expect(provider.id).toBe("poe");
    expect(provider.label).toBe("Poe Video");
  });

  it("has video models from registry", () => {
    const provider = createVideoProvider("test-key");
    expect(provider.models!.length).toBeGreaterThan(5);
    expect(provider.models!.some((m) => m.id === "veo-3")).toBe(true);
  });

  it("generates video from Poe API response", async () => {
    const videoUrl =
      "https://pfst.cf2.poecdn.net/base/video/def456";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: videoUrl } }],
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(5000),
      headers: new Headers({ "content-type": "video/mp4" }),
    });

    const provider = createVideoProvider("test-key");
    const result = await provider.generateVideo({ prompt: "A wave" });

    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].url).toBe(videoUrl);
  });

  it("throws on empty response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "" } }],
      }),
    });

    const provider = createVideoProvider("test-key");
    await expect(
      provider.generateVideo({ prompt: "test" }),
    ).rejects.toThrow("Empty response");
  });
});
