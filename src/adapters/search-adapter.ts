/**
 * Parse Poe Responses API output into search results.
 *
 * The Responses API returns an output array of items with different types.
 * We extract the text content and any citations from the response.
 */

import type { PoeResponsesApiResponse } from "../types.js";

export interface ParsedSearchResponse {
  content: string;
  citations: Array<{ url: string; title?: string }>;
}

/**
 * Parse a Poe Responses API response into content + citations.
 *
 * The response may contain:
 * - output_text: a convenience field with the full text
 * - output[]: an array of items, some with type "message" containing content,
 *   and some with type "web_search_call" or citations
 */
export function parseSearchResponse(
  response: PoeResponsesApiResponse,
): ParsedSearchResponse {
  const citations: Array<{ url: string; title?: string }> = [];

  // Extract citations from output items
  for (const item of response.output ?? []) {
    if (item.content) {
      for (const block of item.content) {
        if (block.type === "output_text" && block.text) {
          // Text content — handled via output_text below
        }
        if (block.url) {
          citations.push({
            url: block.url,
            title: block.title,
          });
        }
      }
    }
  }

  // Prefer output_text (convenience field), fall back to extracting from output
  let content = response.output_text ?? "";

  if (!content) {
    for (const item of response.output ?? []) {
      if (item.content) {
        for (const block of item.content) {
          if (block.type === "output_text" && block.text) {
            content += block.text;
          }
        }
      }
    }
  }

  return { content, citations };
}
