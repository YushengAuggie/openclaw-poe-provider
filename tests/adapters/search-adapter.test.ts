import { describe, it, expect } from "vitest";
import { parseSearchResponse } from "../../src/adapters/search-adapter.js";
import type { PoeResponsesApiResponse } from "../../src/types.js";

describe("parseSearchResponse", () => {
  it("parses standard search response with citations", () => {
    const response: PoeResponsesApiResponse = {
      id: "resp_001",
      output: [
        {
          type: "web_search_call",
          content: undefined,
        },
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: "TypeScript is a typed superset of JavaScript.",
            },
            {
              type: "cite",
              url: "https://www.typescriptlang.org",
              title: "TypeScript Official Site",
            },
            {
              type: "cite",
              url: "https://en.wikipedia.org/wiki/TypeScript",
              title: "TypeScript - Wikipedia",
            },
          ],
        },
      ],
      output_text: "TypeScript is a typed superset of JavaScript.",
    };

    const result = parseSearchResponse(response);

    expect(result.content).toBe("TypeScript is a typed superset of JavaScript.");
    expect(result.citations).toHaveLength(2);
    expect(result.citations[0]).toEqual({
      url: "https://www.typescriptlang.org",
      title: "TypeScript Official Site",
    });
    expect(result.citations[1]).toEqual({
      url: "https://en.wikipedia.org/wiki/TypeScript",
      title: "TypeScript - Wikipedia",
    });
  });

  it("handles response with no citations", () => {
    const response: PoeResponsesApiResponse = {
      id: "resp_002",
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: "Here is a summary with no sources.",
            },
          ],
        },
      ],
      output_text: "Here is a summary with no sources.",
    };

    const result = parseSearchResponse(response);

    expect(result.content).toBe("Here is a summary with no sources.");
    expect(result.citations).toHaveLength(0);
  });

  it("handles response with only output_text (no structured output)", () => {
    const response: PoeResponsesApiResponse = {
      id: "resp_003",
      output: [],
      output_text: "Fallback text content from output_text field.",
    };

    const result = parseSearchResponse(response);

    expect(result.content).toBe("Fallback text content from output_text field.");
    expect(result.citations).toHaveLength(0);
  });

  it("handles empty response", () => {
    const response: PoeResponsesApiResponse = {
      id: "resp_004",
      output: [],
    };

    const result = parseSearchResponse(response);

    expect(result.content).toBe("");
    expect(result.citations).toHaveLength(0);
  });

  it("extracts multiple citations from multiple output items", () => {
    const response: PoeResponsesApiResponse = {
      id: "resp_005",
      output: [
        {
          type: "message",
          content: [
            {
              type: "cite",
              url: "https://example.com/1",
              title: "Source 1",
            },
          ],
        },
        {
          type: "message",
          content: [
            {
              type: "cite",
              url: "https://example.com/2",
              title: "Source 2",
            },
            {
              type: "cite",
              url: "https://example.com/3",
              title: "Source 3",
            },
          ],
        },
      ],
      output_text: "Combined results from multiple sources.",
    };

    const result = parseSearchResponse(response);

    expect(result.content).toBe("Combined results from multiple sources.");
    expect(result.citations).toHaveLength(3);
    expect(result.citations[0].url).toBe("https://example.com/1");
    expect(result.citations[1].url).toBe("https://example.com/2");
    expect(result.citations[2].url).toBe("https://example.com/3");
  });

  it("falls back to extracting text from output items when output_text is missing", () => {
    const response: PoeResponsesApiResponse = {
      id: "resp_006",
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: "Text extracted from output array.",
            },
          ],
        },
      ],
    };

    const result = parseSearchResponse(response);

    expect(result.content).toBe("Text extracted from output array.");
  });

  it("handles citations without title", () => {
    const response: PoeResponsesApiResponse = {
      id: "resp_007",
      output: [
        {
          type: "message",
          content: [
            {
              type: "cite",
              url: "https://example.com/no-title",
            },
          ],
        },
      ],
      output_text: "Some content.",
    };

    const result = parseSearchResponse(response);

    expect(result.citations).toHaveLength(1);
    expect(result.citations[0]).toEqual({
      url: "https://example.com/no-title",
      title: undefined,
    });
  });
});
