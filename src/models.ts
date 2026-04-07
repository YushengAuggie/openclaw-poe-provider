/**
 * Model catalog with /v1/models discovery + TTL cache + hardcoded fallback.
 */

import type { PoeModelEntry, ModelDefinition } from "./types.js";
import { PoeClient } from "./client.js";
import { BotRegistry, defaultRegistry } from "./registry.js";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  models: Set<string>;
  fetchedAt: number;
}

let modelsCache: CacheEntry | null = null;

/** Text model definitions for the provider catalog. */
export const TEXT_MODELS: ModelDefinition[] = [
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", reasoning: true, input: ["text", "image"], contextWindow: 200000, maxTokens: 32000 },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", reasoning: true, input: ["text", "image"], contextWindow: 200000, maxTokens: 64000 },
  { id: "gpt-5.4", name: "GPT-5.4", reasoning: false, input: ["text", "image"], contextWindow: 200000, maxTokens: 16384 },
  { id: "gpt-5.4-pro", name: "GPT-5.4 Pro", reasoning: true, input: ["text", "image"], contextWindow: 200000, maxTokens: 16384 },
  { id: "gpt-5.2", name: "GPT-5.2", reasoning: false, input: ["text"], contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5-mini", name: "GPT-5 Mini", reasoning: false, input: ["text"], contextWindow: 400000, maxTokens: 128000 },
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", reasoning: true, input: ["text", "image"], contextWindow: 1048576, maxTokens: 65536 },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", reasoning: false, input: ["text", "image"], contextWindow: 1048576, maxTokens: 65536 },
  { id: "gemini-3-flash", name: "Gemini 3 Flash", reasoning: false, input: ["text", "image"], contextWindow: 1048576, maxTokens: 65536 },
  { id: "kimi-k2.5", name: "Kimi K2.5", reasoning: false, input: ["text"], contextWindow: 256000, maxTokens: 256000 },
  { id: "kimi-k2-thinking", name: "Kimi K2 Thinking", reasoning: true, input: ["text"], contextWindow: 262000, maxTokens: 262000 },
];

/**
 * Fetch available model IDs from Poe's /v1/models endpoint.
 * Uses a 30-minute TTL cache to avoid slow cold starts.
 */
export async function fetchAvailableModels(
  client: PoeClient,
): Promise<Set<string>> {
  const now = Date.now();
  if (modelsCache && now - modelsCache.fetchedAt < CACHE_TTL_MS) {
    return modelsCache.models;
  }

  try {
    const response = await client.listModels();
    const modelIds = new Set(response.data.map((m: PoeModelEntry) => m.id));
    modelsCache = { models: modelIds, fetchedAt: now };
    return modelIds;
  } catch {
    // On failure, return cached data if available, or empty set
    return modelsCache?.models ?? new Set();
  }
}

/** Clear the models cache (useful for testing). */
export function clearModelsCache(): void {
  modelsCache = null;
}

/**
 * Resolve a model ID for a specific capability.
 * If the requested model exists in the registry, use it.
 * Otherwise fall back to the default for that capability.
 */
export function resolveModelForCapability(
  requestedModel: string | undefined,
  capability: "image" | "video" | "speech" | "music",
  registry: BotRegistry = defaultRegistry,
): string {
  if (requestedModel) {
    // Strip "poe/" prefix if present
    const cleanId = requestedModel.replace(/^poe\//, "");
    if (registry.has(cleanId)) {
      return cleanId;
    }
    // If not in registry, still try it (might be a new bot)
    return cleanId;
  }

  const defaultBot = registry.defaultFor(capability);
  if (defaultBot) {
    return defaultBot.botName;
  }

  // Hardcoded ultimate fallbacks
  const fallbacks: Record<string, string> = {
    image: "imagen-4-fast",
    video: "veo-3-fast",
    speech: "elevenlabs-v3",
    music: "lyria-3",
  };
  return fallbacks[capability];
}
