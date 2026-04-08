import { describe, it, expect } from "vitest";
import {
  extractImageUrls,
  extractAudioUrl,
  extractVideoUrl,
  extractMusicData,
  hasMediaContent,
} from "../../src/adapters/media-extractor.js";

// ── Fixtures (recorded from real Poe API responses) ─────────────────────────

const IMAGE_RESPONSE =
  '![A friendly orange cat wearing sunglasses_image_1](https://pfst.cf2.poecdn.net/base/image/680dd129843074276d1ecb00ff491eba9ac22f62f81727e4017a094ddf297f17?w=1024&h=1024)\n\n\nhttps://pfst.cf2.poecdn.net/base/image/680dd129843074276d1ecb00ff491eba9ac22f62f81727e4017a094ddf297f17?w=1024&h=1024';

const TTS_RESPONSE =
  "https://pfst.cf2.poecdn.net/base/audio/2ceed7ea1bec868244814e16f9d304accfd14dc024fb17755830164323d74d42";

const MUSIC_RESPONSE =
  'Caption: This instrumental is a quintessential example of the chill Lo-Fi Hip Hop genre, prioritizing a hazy, nostalgic atmosphere over pristine production. The rhythmic foundation is a dusty, unquantized drum loop.\nMosic: 4.5\nBPM: 80.0\n\nhttps://pfst.cf2.poecdn.net/base/audio/df6cd36b074ccd2b88d4ed783c74adf4866c1a91491d8983b70eb7ed18831279';

const VIDEO_RESPONSE =
  "https://pfst.cf2.poecdn.net/base/video/21f080f6ba2545c234350b1313a23fb4ca8933e9189e8fa774fd3100d21ef34f";

// ── Image Extraction ────────────────────────────────────────────────────────

describe("extractImageUrls", () => {
  it("extracts image URL from standard Poe image response", () => {
    const images = extractImageUrls(IMAGE_RESPONSE);
    expect(images).toHaveLength(1); // deduped: markdown + raw are same URL
    expect(images[0].url).toContain("/base/image/");
    expect(images[0].altText).toBe(
      "A friendly orange cat wearing sunglasses_image_1",
    );
  });

  it("handles multiple images in one response", () => {
    const multi = [
      "![cat1](https://pfst.cf2.poecdn.net/base/image/aaa111?w=1024&h=1024)",
      "![cat2](https://pfst.cf2.poecdn.net/base/image/bbb222?w=1024&h=1024)",
    ].join("\n\n");
    const images = extractImageUrls(multi);
    expect(images).toHaveLength(2);
    expect(images[0].altText).toBe("cat1");
    expect(images[1].altText).toBe("cat2");
  });

  it("handles image URL without markdown wrapper", () => {
    const raw =
      "https://pfst.cf2.poecdn.net/base/image/abc123def456";
    const images = extractImageUrls(raw);
    expect(images).toHaveLength(1);
    expect(images[0].url).toBe(raw);
  });

  it("returns empty for non-image content", () => {
    expect(extractImageUrls("Hello, how are you?")).toEqual([]);
    expect(extractImageUrls("")).toEqual([]);
  });

  it("deduplicates URLs that appear as both markdown and raw", () => {
    const url = "https://pfst.cf2.poecdn.net/base/image/abc123?w=512&h=512";
    const content = `![desc](${url})\n\n${url}`;
    const images = extractImageUrls(content);
    expect(images).toHaveLength(1);
  });

  it("falls back to common image extensions", () => {
    const content = "Here is your image: https://example.com/output.png";
    const images = extractImageUrls(content);
    expect(images).toHaveLength(1);
    expect(images[0].url).toContain(".png");
  });

  it("falls back to non-Poe CDN URLs with .webp extension", () => {
    const content = "Here: https://cdn.example.com/photo.webp";
    const images = extractImageUrls(content);
    expect(images).toHaveLength(1);
    expect(images[0].url).toContain(".webp");
  });

  it("falls back to non-Poe CDN URLs with .gif extension", () => {
    const content = "Animated: https://cdn.example.com/animation.gif";
    const images = extractImageUrls(content);
    expect(images).toHaveLength(1);
    expect(images[0].url).toContain(".gif");
  });

  it("falls back to non-Poe CDN URLs with .svg extension", () => {
    const content = "Vector: https://cdn.example.com/logo.svg";
    const images = extractImageUrls(content);
    expect(images).toHaveLength(1);
    expect(images[0].url).toContain(".svg");
  });
});

// ── Audio/TTS Extraction ────────────────────────────────────────────────────

describe("extractAudioUrl", () => {
  it("extracts audio URL from TTS response", () => {
    const audio = extractAudioUrl(TTS_RESPONSE);
    expect(audio).not.toBeNull();
    expect(audio!.url).toContain("/base/audio/");
  });

  it("returns null for non-audio content", () => {
    expect(extractAudioUrl("Hello world")).toBeNull();
    expect(extractAudioUrl("")).toBeNull();
  });

  it("extracts audio URL mixed with other text", () => {
    const content =
      "Here is your audio:\nhttps://pfst.cf2.poecdn.net/base/audio/abc123";
    const audio = extractAudioUrl(content);
    expect(audio).not.toBeNull();
    expect(audio!.url).toContain("/base/audio/");
  });

  it("falls back to common audio extensions", () => {
    const content = "Download: https://example.com/speech.mp3";
    const audio = extractAudioUrl(content);
    expect(audio).not.toBeNull();
    expect(audio!.url).toContain(".mp3");
  });

  it("falls back to .flac extension", () => {
    const content = "Lossless: https://cdn.example.com/track.flac";
    const audio = extractAudioUrl(content);
    expect(audio).not.toBeNull();
    expect(audio!.url).toContain(".flac");
  });

  it("falls back to .aac extension", () => {
    const content = "Audio: https://cdn.example.com/sound.aac";
    const audio = extractAudioUrl(content);
    expect(audio).not.toBeNull();
    expect(audio!.url).toContain(".aac");
  });
});

// ── Video Extraction ────────────────────────────────────────────────────────

describe("extractVideoUrl", () => {
  it("extracts video URL from video bot response", () => {
    const video = extractVideoUrl(VIDEO_RESPONSE);
    expect(video).not.toBeNull();
    expect(video!.url).toContain("/base/video/");
  });

  it("returns null for non-video content", () => {
    expect(extractVideoUrl("Hello world")).toBeNull();
    expect(extractVideoUrl("")).toBeNull();
  });

  it("falls back to common video extensions", () => {
    const content = "Your video: https://example.com/clip.mp4";
    const video = extractVideoUrl(content);
    expect(video).not.toBeNull();
    expect(video!.url).toContain(".mp4");
  });

  it("falls back to .webm extension", () => {
    const content = "Video: https://cdn.example.com/clip.webm";
    const video = extractVideoUrl(content);
    expect(video).not.toBeNull();
    expect(video!.url).toContain(".webm");
  });

  it("falls back to .mkv extension", () => {
    const content = "Video: https://cdn.example.com/movie.mkv";
    const video = extractVideoUrl(content);
    expect(video).not.toBeNull();
    expect(video!.url).toContain(".mkv");
  });
});

// ── Music Extraction ────────────────────────────────────────────────────────

describe("extractMusicData", () => {
  it("extracts music URL and description from music bot response", () => {
    const music = extractMusicData(MUSIC_RESPONSE);
    expect(music).not.toBeNull();
    expect(music!.url).toContain("/base/audio/");
    expect(music!.description).toBeDefined();
    expect(music!.description).toContain("Lo-Fi Hip Hop");
  });

  it("strips 'Caption:' prefix from description", () => {
    const music = extractMusicData(MUSIC_RESPONSE);
    expect(music!.description).not.toMatch(/^Caption:/);
  });

  it("handles audio-only response (no description)", () => {
    const music = extractMusicData(TTS_RESPONSE);
    expect(music).not.toBeNull();
    expect(music!.url).toContain("/base/audio/");
    expect(music!.description).toBeUndefined();
  });

  it("returns null for non-audio content", () => {
    expect(extractMusicData("No audio here")).toBeNull();
  });

  it("handles audio URL at the very start of content (no description)", () => {
    const url = "https://pfst.cf2.poecdn.net/base/audio/startaudio123";
    const music = extractMusicData(url);
    expect(music).not.toBeNull();
    expect(music!.url).toBe(url);
    expect(music!.description).toBeUndefined();
  });
});

// ── hasMediaContent ─────────────────────────────────────────────────────────

describe("hasMediaContent", () => {
  it("detects image CDN URLs", () => {
    expect(hasMediaContent(IMAGE_RESPONSE)).toBe(true);
  });

  it("detects audio CDN URLs", () => {
    expect(hasMediaContent(TTS_RESPONSE)).toBe(true);
  });

  it("detects video CDN URLs", () => {
    expect(hasMediaContent(VIDEO_RESPONSE)).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(hasMediaContent("Just a text response")).toBe(false);
    expect(hasMediaContent("")).toBe(false);
  });
});
