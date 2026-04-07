/**
 * Tests verifying the actual request body sent to the Poe API.
 * Addresses Claude Code review: "Provider tests don't verify request body"
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createImageProvider } from "../../src/providers/image.js";
import { createVideoProvider } from "../../src/providers/video.js";
import { createSpeechProvider } from "../../src/providers/speech.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to return a valid media response
function mockMediaResponse(content: string) {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  };
}

function mockDownload() {
  return {
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(100),
    headers: new Headers({ "content-type": "application/octet-stream" }),
  };
}

describe("Image provider request body", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends correct model and prompt", async () => {
    const imgUrl = "https://pfst.cf2.poecdn.net/base/image/abc123";
    mockFetch
      .mockResolvedValueOnce(mockMediaResponse(`![img](${imgUrl})`))
      .mockResolvedValueOnce(mockDownload());

    const provider = createImageProvider("test-key");
    await provider.generate({ prompt: "A sunset", model: "dall-e-3" });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("dall-e-3");
    expect(body.messages[0].content).toContain("A sunset");
    expect(body.stream).toBe(false);
  });

  it("includes aspect ratio in prompt", async () => {
    const imgUrl = "https://pfst.cf2.poecdn.net/base/image/abc123";
    mockFetch
      .mockResolvedValueOnce(mockMediaResponse(`![img](${imgUrl})`))
      .mockResolvedValueOnce(mockDownload());

    const provider = createImageProvider("test-key");
    await provider.generate({
      prompt: "A cat",
      aspectRatio: "16:9",
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("[aspect ratio: 16:9]");
  });

  it("uses default model when none specified", async () => {
    const imgUrl = "https://pfst.cf2.poecdn.net/base/image/abc123";
    mockFetch
      .mockResolvedValueOnce(mockMediaResponse(`![img](${imgUrl})`))
      .mockResolvedValueOnce(mockDownload());

    const provider = createImageProvider("test-key");
    await provider.generate({ prompt: "A cat" });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("imagen-4"); // Default from registry
  });
});

describe("Video provider request body", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends correct model and includes duration", async () => {
    const videoUrl = "https://pfst.cf2.poecdn.net/base/video/def456";
    mockFetch
      .mockResolvedValueOnce(mockMediaResponse(videoUrl))
      .mockResolvedValueOnce(mockDownload());

    const provider = createVideoProvider("test-key");
    await provider.generateVideo({
      prompt: "Ocean waves",
      model: "veo-3-fast",
      durationSeconds: 10,
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("veo-3-fast");
    expect(body.messages[0].content).toContain("Ocean waves");
    expect(body.messages[0].content).toContain("[duration: 10s]");
    expect(body.stream).toBe(false);
  });
});

describe("Speech provider request body", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends text as-is in message content", async () => {
    const audioUrl = "https://pfst.cf2.poecdn.net/base/audio/ghi789";
    mockFetch
      .mockResolvedValueOnce(mockMediaResponse(audioUrl))
      .mockResolvedValueOnce(mockDownload());

    const provider = createSpeechProvider("test-key");
    await provider.synthesize({
      text: "Hello, how are you?",
      model: "elevenlabs-v3",
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("elevenlabs-v3");
    expect(body.messages[0].content).toBe("Hello, how are you?");
    expect(body.stream).toBe(false);
  });
});
