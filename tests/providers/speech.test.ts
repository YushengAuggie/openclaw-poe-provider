import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSpeechProvider } from "../../src/providers/speech.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("createSpeechProvider", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("has correct provider id and label", () => {
    const provider = createSpeechProvider("test-key");
    expect(provider.id).toBe("poe");
    expect(provider.label).toBe("Poe Speech");
  });

  it("synthesizes speech from TTS bot response", async () => {
    const audioUrl =
      "https://pfst.cf2.poecdn.net/base/audio/abc123";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: audioUrl } }],
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(2000),
      headers: new Headers({ "content-type": "audio/mpeg" }),
    });

    const provider = createSpeechProvider("test-key");
    const result = await provider.synthesize({ text: "Hello world" });

    expect(result.audioBuffer).toBeInstanceOf(Buffer);
    expect(result.outputFormat).toBe("mp3");
    expect(result.fileExtension).toBe(".mp3");
  });

  it("detects opus format", async () => {
    const audioUrl =
      "https://pfst.cf2.poecdn.net/base/audio/abc123";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: audioUrl } }],
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(2000),
      headers: new Headers({ "content-type": "audio/opus" }),
    });

    const provider = createSpeechProvider("test-key");
    const result = await provider.synthesize({ text: "Hello" });

    expect(result.outputFormat).toBe("opus");
    expect(result.fileExtension).toBe(".ogg");
    expect(result.voiceCompatible).toBe(true);
  });

  it("throws on empty response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "" } }],
      }),
    });

    const provider = createSpeechProvider("test-key");
    await expect(
      provider.synthesize({ text: "hello" }),
    ).rejects.toThrow("Empty response");
  });
});
