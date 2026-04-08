/**
 * Web search provider for Poe.
 *
 * Uses Poe's Responses API (POST /v1/responses) with the web_search_preview
 * tool — a different endpoint from chat completions.
 */

import type {
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
} from "../types.js";
import { PoeClient } from "../client.js";
import { parseSearchResponse } from "../adapters/search-adapter.js";
import { emptyResponseError, wrapError } from "../errors.js";
import { resolveModelForCapability } from "../models.js";
import { defaultRegistry } from "../registry.js";

export function createSearchProvider(apiKey: string): WebSearchProvider {
  const client = new PoeClient({ apiKey });

  return {
    id: "poe",
    label: "Poe Search",

    isConfigured: () => Boolean(apiKey),

    async search(req: WebSearchRequest): Promise<WebSearchResult> {
      const model = resolveModelForCapability(undefined, "search");

      try {
        const response = await client.responsesApiSearch({
          model,
          query: req.query,
        });

        const parsed = parseSearchResponse(response);

        if (!parsed.content) {
          throw emptyResponseError("Search", model);
        }

        return {
          content: parsed.content,
          citations: parsed.citations.length > 0 ? parsed.citations : undefined,
        };
      } catch (err) {
        throw wrapError(err, `Web search with ${model}`);
      }
    },
  };
}
