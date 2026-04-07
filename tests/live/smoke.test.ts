/**
 * Live smoke tests against real Poe API.
 *
 * ONLY run when TEST_POE_LIVE=1 and POE_API_KEY are set.
 * These tests consume compute points!
 *
 * Usage: TEST_POE_LIVE=1 POE_API_KEY=your-key npx vitest run tests/live/
 */

import { describe, it, expect, beforeAll } from "vitest";
import { PoeClient } from "../../src/client.js";
import { createImageProvider } from "../../src/providers/image.js";
import { createSpeechProvider } from "../../src/providers/speech.js";

const LIVE = process.env.TEST_POE_LIVE === "1" && process.env.POE_API_KEY;

describe.skipIf(!LIVE)("Live Poe API smoke tests", () => {
  let apiKey: string;

  beforeAll(() => {
    apiKey = process.env.POE_API_KEY!;
  });

  it("lists models from /v1/models", async () => {
    const client = new PoeClient({ apiKey });
    const result = await client.listModels();
    expect(result.data.length).toBeGreaterThan(100);
    // Verify some known bots exist
    const ids = result.data.map((m) => m.id);
    // Bot names are lowercase on Poe API
    const lowerIds = ids.map((id: string) => id.toLowerCase());
    expect(lowerIds.some((id: string) => id.includes("gpt") || id.includes("claude"))).toBe(true);
  }, 30_000);

  it("generates a text completion", async () => {
    const client = new PoeClient({ apiKey });
    const result = await client.chatCompletion({
      model: "GPT-4o-Mini",
      messages: [{ role: "user", content: "Say 'hello' and nothing else." }],
      stream: false,
    });
    expect(result.choices[0].message.content.toLowerCase()).toContain("hello");
  }, 30_000);

  it("generates an image", async () => {
    const provider = createImageProvider(apiKey);
    const result = await provider.generate({
      prompt: "A simple red circle on white background",
      model: "dall-e-3",
    });
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0].url).toContain("http");
  }, 60_000);

  it("synthesizes speech", async () => {
    const provider = createSpeechProvider(apiKey);
    const result = await provider.synthesize({
      text: "Hello, this is a test.",
      model: "elevenlabs-v2.5-turbo",
    });
    expect(result.audioBuffer.length).toBeGreaterThan(100);
    expect(["mp3", "opus", "wav"]).toContain(result.outputFormat);
  }, 60_000);
});
