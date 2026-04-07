import { describe, it, expect } from "vitest";
import {
  buildImagePrompt,
  buildVideoPrompt,
  buildMusicPrompt,
  validatePrompt,
} from "../../src/adapters/param-mapper.js";

describe("buildImagePrompt", () => {
  it("returns base prompt when no options", () => {
    expect(buildImagePrompt({ prompt: "A cat" })).toBe("A cat");
  });

  it("adds aspect ratio", () => {
    const prompt = buildImagePrompt({ prompt: "A cat", aspectRatio: "16:9" });
    expect(prompt).toContain("[aspect ratio: 16:9]");
  });

  it("adds size", () => {
    const prompt = buildImagePrompt({ prompt: "A cat", size: "1024x1024" });
    expect(prompt).toContain("[size: 1024x1024]");
  });

  it("adds count when > 1", () => {
    const prompt = buildImagePrompt({ prompt: "A cat", count: 4 });
    expect(prompt).toContain("[count: 4]");
  });

  it("does not add count when 1", () => {
    const prompt = buildImagePrompt({ prompt: "A cat", count: 1 });
    expect(prompt).not.toContain("[count:");
  });

  it("combines all options", () => {
    const prompt = buildImagePrompt({
      prompt: "A cat",
      aspectRatio: "1:1",
      size: "512x512",
      count: 2,
    });
    expect(prompt).toContain("A cat");
    expect(prompt).toContain("[aspect ratio: 1:1]");
    expect(prompt).toContain("[size: 512x512]");
    expect(prompt).toContain("[count: 2]");
  });
});

describe("buildVideoPrompt", () => {
  it("returns base prompt when no options", () => {
    expect(buildVideoPrompt({ prompt: "A sunset" })).toBe("A sunset");
  });

  it("adds duration", () => {
    const prompt = buildVideoPrompt({ prompt: "A wave", durationSeconds: 10 });
    expect(prompt).toContain("[duration: 10s]");
  });

  it("adds aspect ratio and resolution", () => {
    const prompt = buildVideoPrompt({
      prompt: "test",
      aspectRatio: "16:9",
      resolution: "1080P",
    });
    expect(prompt).toContain("[aspect ratio: 16:9]");
    expect(prompt).toContain("[resolution: 1080P]");
  });
});

describe("buildMusicPrompt", () => {
  it("returns base prompt when no options", () => {
    expect(buildMusicPrompt({ prompt: "jazz" })).toBe("jazz");
  });

  it("adds instrumental flag", () => {
    const prompt = buildMusicPrompt({ prompt: "jazz", instrumental: true });
    expect(prompt).toContain("[instrumental only, no vocals]");
  });

  it("adds duration", () => {
    const prompt = buildMusicPrompt({ prompt: "jazz", durationSeconds: 30 });
    expect(prompt).toContain("[duration: 30s]");
  });

  it("appends lyrics as separate section", () => {
    const prompt = buildMusicPrompt({
      prompt: "pop song",
      lyrics: "Hello world\nGoodbye moon",
    });
    expect(prompt).toContain("Lyrics:\nHello world\nGoodbye moon");
    expect(prompt.indexOf("Lyrics:")).toBeGreaterThan(prompt.indexOf("pop song"));
  });
});

describe("validatePrompt", () => {
  it("passes for valid prompts", () => {
    expect(() => validatePrompt("A cat", "test")).not.toThrow();
    expect(() => validatePrompt("Hi", "test")).not.toThrow();
  });

  it("rejects empty prompts", () => {
    expect(() => validatePrompt("", "Image")).toThrow("prompt cannot be empty");
    expect(() => validatePrompt("   ", "Image")).toThrow("prompt cannot be empty");
  });

  it("rejects single-character prompts", () => {
    expect(() => validatePrompt("a", "Image")).toThrow("too short");
  });

  it("includes context in error message", () => {
    expect(() => validatePrompt("", "Video generation")).toThrow(
      "Video generation",
    );
  });
});
