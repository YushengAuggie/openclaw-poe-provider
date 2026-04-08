import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMusicProvider } from "../../src/providers/music.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("createMusicProvider", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("has correct provider id and label", () => {
    const provider = createMusicProvider("test-key");
    expect(provider.id).toBe("poe");
    expect(provider.label).toBe("Poe Music");
  });

  it("has music models from registry", () => {
    const provider = createMusicProvider("test-key");
    expect(provider.models!.length).toBeGreaterThan(0);
    expect(provider.models!.some((m) => m.id === "lyria-3")).toBe(true);
  });

  it("generates music from Poe API response", async () => {
    const audioUrl =
      "https://pfst.cf2.poecdn.net/base/audio/music123";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: `Caption: A chill lo-fi beat\nBPM: 80\n\n${audioUrl}`,
            },
          },
        ],
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(50000),
      headers: new Headers({ "content-type": "audio/mpeg" }),
    });

    const provider = createMusicProvider("test-key");
    const result = await provider.generate({ prompt: "lo-fi beat" });

    expect(result.audio.url).toBe(audioUrl);
    expect(result.audio.buffer).toBeInstanceOf(Buffer);
    expect(result.description).toContain("chill lo-fi");
  });

  it("passes instrumental flag in prompt", async () => {
    const audioUrl =
      "https://pfst.cf2.poecdn.net/base/audio/inst123";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: audioUrl } }],
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(1000),
      headers: new Headers({ "content-type": "audio/mpeg" }),
    });

    const provider = createMusicProvider("test-key");
    await provider.generate({
      prompt: "jazz",
      instrumental: true,
    });

    // Verify the prompt sent to API included instrumental flag
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.messages[0].content).toContain("instrumental");
  });

  it("throws when no music URL found in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: "Sorry, I cannot generate that music." } },
        ],
      }),
    });

    const provider = createMusicProvider("test-key");
    await expect(
      provider.generate({ prompt: "test" }),
    ).rejects.toThrow("no music URL");
  });

  it("reports configured when key exists", () => {
    const provider = createMusicProvider("test-key");
    expect(provider.isConfigured({})).toBe(true);
  });

  it("reports not configured when key is empty", () => {
    const provider = createMusicProvider("");
    expect(provider.isConfigured({})).toBe(false);
  });

  it("passes duration parameter in prompt", async () => {
    const audioUrl =
      "https://pfst.cf2.poecdn.net/base/audio/dur123";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: audioUrl } }],
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(1000),
      headers: new Headers({ "content-type": "audio/mpeg" }),
    });

    const provider = createMusicProvider("test-key");
    await provider.generate({
      prompt: "jazz",
      durationSeconds: 30,
    });

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.messages[0].content).toContain("[duration: 30s]");
  });

  it("throws on empty response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "" } }],
      }),
    });

    const provider = createMusicProvider("test-key");
    await expect(
      provider.generate({ prompt: "test" }),
    ).rejects.toThrow("Empty response");
  });
});
