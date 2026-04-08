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

  it("detects wav format", async () => {
    const audioUrl =
      "https://pfst.cf2.poecdn.net/base/audio/wav123";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: audioUrl } }],
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(2000),
      headers: new Headers({ "content-type": "audio/wav" }),
    });

    const provider = createSpeechProvider("test-key");
    const result = await provider.synthesize({ text: "Hello" });

    expect(result.outputFormat).toBe("wav");
    expect(result.fileExtension).toBe(".wav");
    expect(result.voiceCompatible).toBe(false);
  });

  it("throws validation error when text is empty", async () => {
    const provider = createSpeechProvider("test-key");

    const err: any = await provider
      .synthesize({ text: "" })
      .catch((e: unknown) => e);

    expect(err.statusCode).toBe(400);
    expect(err.message).toContain("text cannot be empty");
    // Should not have called the API
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws validation error when text is only whitespace", async () => {
    const provider = createSpeechProvider("test-key");

    await expect(
      provider.synthesize({ text: "   " }),
    ).rejects.toThrow("text cannot be empty");

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws when no audio URL found in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: "Sorry, I could not synthesize that text." } },
        ],
      }),
    });

    const provider = createSpeechProvider("test-key");
    await expect(
      provider.synthesize({ text: "hello" }),
    ).rejects.toThrow("no tts URL");
  });

  it("reports configured when key exists", () => {
    const provider = createSpeechProvider("test-key");
    expect(provider.isConfigured({})).toBe(true);
  });

  it("reports not configured when key is empty", () => {
    const provider = createSpeechProvider("");
    expect(provider.isConfigured({})).toBe(false);
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
