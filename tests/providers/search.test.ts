import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSearchProvider } from "../../src/providers/search.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("createSearchProvider", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("has correct provider id and label", () => {
    const provider = createSearchProvider("test-key");
    expect(provider.id).toBe("poe");
    expect(provider.label).toBe("Poe Search");
  });

  it("reports configured when key exists", () => {
    const provider = createSearchProvider("test-key");
    expect(provider.isConfigured({})).toBe(true);
  });

  it("reports not configured when key is empty", () => {
    const provider = createSearchProvider("");
    expect(provider.isConfigured({})).toBe(false);
  });

  it("performs search and returns content with citations", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "resp_001",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "TypeScript is a programming language.",
              },
              {
                type: "cite",
                url: "https://www.typescriptlang.org",
                title: "TypeScript",
              },
            ],
          },
        ],
        output_text: "TypeScript is a programming language.",
      }),
    });

    const provider = createSearchProvider("test-key");
    const result = await provider.search({ query: "what is TypeScript" });

    expect(result.content).toBe("TypeScript is a programming language.");
    expect(result.citations).toHaveLength(1);
    expect(result.citations![0].url).toBe("https://www.typescriptlang.org");
    expect(result.citations![0].title).toBe("TypeScript");
  });

  it("handles response with no citations", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "resp_002",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "A simple answer with no sources.",
              },
            ],
          },
        ],
        output_text: "A simple answer with no sources.",
      }),
    });

    const provider = createSearchProvider("test-key");
    const result = await provider.search({ query: "simple question" });

    expect(result.content).toBe("A simple answer with no sources.");
    expect(result.citations).toBeUndefined();
  });

  it("throws on empty response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "resp_003",
        output: [],
      }),
    });

    const provider = createSearchProvider("test-key");
    await expect(
      provider.search({ query: "test" }),
    ).rejects.toThrow("Empty response");
  });

  it("uses Responses API endpoint (not chat/completions)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "resp_004",
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: "result" }],
          },
        ],
        output_text: "result",
      }),
    });

    const provider = createSearchProvider("test-key");
    await provider.search({ query: "test query" });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("/responses");
    expect(calledUrl).not.toContain("/chat/completions");
  });

  it("request body includes web_search_preview tool", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "resp_005",
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: "result" }],
          },
        ],
        output_text: "result",
      }),
    });

    const provider = createSearchProvider("test-key");
    await provider.search({ query: "test query" });

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.tools).toEqual([{ type: "web_search_preview" }]);
    expect(callBody.input).toBe("test query");
  });

  it("sends query as input string (not messages array)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "resp_006",
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: "result" }],
          },
        ],
        output_text: "result",
      }),
    });

    const provider = createSearchProvider("test-key");
    await provider.search({ query: "what is the capital of France" });

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.input).toBe("what is the capital of France");
    expect(callBody.messages).toBeUndefined();
  });
});
