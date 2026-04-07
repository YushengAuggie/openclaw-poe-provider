import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadMedia } from "../../src/adapters/media-extractor.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("downloadMedia", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("downloads media and returns buffer with content type", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      headers: new Headers({ "content-type": "image/png" }),
    });

    const result = await downloadMedia("https://cdn.example.com/image.png");
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBe(3);
    expect(result.contentType).toBe("image/png");
  });

  it("returns application/octet-stream when no content-type header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
      headers: new Headers(),
    });

    const result = await downloadMedia("https://cdn.example.com/file");
    expect(result.contentType).toBe("application/octet-stream");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(
      downloadMedia("https://cdn.example.com/missing"),
    ).rejects.toThrow("HTTP 404");
  });

  it("throws on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

    await expect(
      downloadMedia("https://cdn.example.com/fail"),
    ).rejects.toThrow("Connection refused");
  });
});
