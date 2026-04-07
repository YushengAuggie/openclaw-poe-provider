/**
 * Text/LLM provider registration for Poe.
 */

import type {
  ProviderRegistration,
  ProviderAuthMethod,
  ResolvedModel,
} from "../types.js";
import { TEXT_MODELS } from "../models.js";

const POE_BASE_URL = "https://api.poe.com/v1";

export function createTextProvider(): ProviderRegistration {
  const authMethod: ProviderAuthMethod = {
    methodId: "api-key",
    label: "Poe API key",
    hint: "API key from poe.com/api_key — one key for all AI capabilities",
    envVar: "POE_API_KEY",
  };

  return {
    id: "poe",
    label: "Poe",
    docsPath: "/providers/poe",
    envVars: ["POE_API_KEY"],

    auth: [authMethod],

    catalog: {
      order: "simple",
      run: async (ctx) => {
        const { apiKey } = ctx.resolveProviderApiKey("poe");
        if (!apiKey) return null;

        return {
          provider: {
            baseUrl: POE_BASE_URL,
            apiKey,
            api: "openai-completions",
            models: TEXT_MODELS.map((m) => ({
              ...m,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            })),
          },
        };
      },
    },

    resolveDynamicModel: (ctx) => {
      // Accept any model ID — Poe has hundreds of bots
      return {
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "poe",
        api: "openai-completions",
        baseUrl: POE_BASE_URL,
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 200000,
        maxTokens: 8192,
      } satisfies ResolvedModel;
    },
  };
}
