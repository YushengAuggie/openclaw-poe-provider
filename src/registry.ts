/**
 * Declarative bot registry.
 *
 * Maps Poe bot names to capabilities, allowing new bots to be added
 * without code changes. The registry is the single source of truth for
 * which bots are available and what they do.
 */

import type { BotCapability, BotRegistryEntry } from "./types.js";

// ── Default Bot Catalog ─────────────────────────────────────────────────────

const DEFAULT_BOTS: BotRegistryEntry[] = [
  // ── Image Generation ──
  { botName: "imagen-4", displayName: "Imagen 4", capability: "image", isDefault: true },
  { botName: "imagen-4-fast", displayName: "Imagen 4 Fast", capability: "image" },
  { botName: "imagen-4-ultra", displayName: "Imagen 4 Ultra", capability: "image" },
  { botName: "gpt-image-1", displayName: "GPT Image 1", capability: "image" },
  { botName: "gpt-image-1-mini", displayName: "GPT Image 1 Mini", capability: "image" },
  { botName: "gpt-image-1.5", displayName: "GPT Image 1.5", capability: "image" },
  { botName: "flux-kontext-max", displayName: "Flux Kontext Max", capability: "image" },
  { botName: "flux-kontext-pro", displayName: "Flux Kontext Pro", capability: "image" },
  { botName: "flux-2-pro", displayName: "Flux 2 Pro", capability: "image" },
  { botName: "flux-2-max", displayName: "Flux 2 Max", capability: "image" },
  { botName: "dall-e-3", displayName: "DALL-E 3", capability: "image" },
  { botName: "seedream-3.0", displayName: "Seedream 3.0", capability: "image" },
  { botName: "seedream-4.0", displayName: "Seedream 4.0", capability: "image" },
  { botName: "seedream-5.0-lite", displayName: "Seedream 5.0 Lite", capability: "image" },
  { botName: "grok-imagine-image", displayName: "Grok Imagine", capability: "image" },
  { botName: "hunyuan-image-3", displayName: "Hunyuan Image 3", capability: "image" },
  { botName: "qwen-image-2-pro", displayName: "Qwen Image 2 Pro", capability: "image" },
  { botName: "kling-image-o1", displayName: "Kling Image O1", capability: "image" },

  // ── Video Generation ──
  { botName: "veo-3", displayName: "Veo 3", capability: "video", isDefault: true },
  { botName: "veo-3-fast", displayName: "Veo 3 Fast", capability: "video" },
  { botName: "veo-3.1", displayName: "Veo 3.1", capability: "video" },
  { botName: "veo-3.1-fast", displayName: "Veo 3.1 Fast", capability: "video" },
  { botName: "runway-gen-4-turbo", displayName: "Runway Gen 4 Turbo", capability: "video" },
  { botName: "runway-gen-4.5", displayName: "Runway Gen 4.5", capability: "video" },
  { botName: "kling-2.1-master", displayName: "Kling 2.1 Master", capability: "video" },
  { botName: "kling-v3-pro", displayName: "Kling V3 Pro", capability: "video" },
  { botName: "kling-2.6-pro", displayName: "Kling 2.6 Pro", capability: "video" },
  { botName: "seedance-1.0-pro", displayName: "Seedance 1.0 Pro", capability: "video" },
  { botName: "hunyuan-video-1.5", displayName: "Hunyuan Video 1.5", capability: "video" },
  { botName: "grok-imagine-video", displayName: "Grok Imagine Video", capability: "video" },

  // ── Speech/TTS ──
  { botName: "elevenlabs-v3", displayName: "ElevenLabs V3", capability: "speech", isDefault: true },
  { botName: "elevenlabs-v2.5-turbo", displayName: "ElevenLabs V2.5 Turbo", capability: "speech" },
  { botName: "gemini-2.5-flash-tts", displayName: "Gemini Flash TTS", capability: "speech" },
  { botName: "gpt-audio", displayName: "GPT Audio", capability: "speech" },
  { botName: "hailuo-speech-02", displayName: "Hailuo Speech", capability: "speech" },
  { botName: "minimax-speech-2.8", displayName: "MiniMax Speech", capability: "speech" },
  { botName: "orpheus-tts", displayName: "Orpheus TTS", capability: "speech" },

  // ── Music ──
  { botName: "lyria-3", displayName: "Lyria 3", capability: "music", isDefault: true },
  { botName: "lyria", displayName: "Lyria", capability: "music" },
  { botName: "elevenlabs-music", displayName: "ElevenLabs Music", capability: "music" },
  { botName: "stable-audio-2.5", displayName: "Stable Audio 2.5", capability: "music" },
];

// ── Registry Class ──────────────────────────────────────────────────────────

export class BotRegistry {
  private bots: Map<string, BotRegistryEntry>;

  constructor(entries?: BotRegistryEntry[]) {
    this.bots = new Map();
    for (const entry of entries ?? DEFAULT_BOTS) {
      this.bots.set(entry.botName, entry);
    }
  }

  /** Get a specific bot entry by name. */
  get(botName: string): BotRegistryEntry | undefined {
    return this.bots.get(botName);
  }

  /** Check if a bot name is registered. */
  has(botName: string): boolean {
    return this.bots.has(botName);
  }

  /** Get all bots with a specific capability. */
  byCapability(capability: BotCapability): BotRegistryEntry[] {
    return Array.from(this.bots.values()).filter(
      (b) => b.capability === capability,
    );
  }

  /** Get the default bot for a capability, or the first available. */
  defaultFor(capability: BotCapability): BotRegistryEntry | undefined {
    const bots = this.byCapability(capability);
    return bots.find((b) => b.isDefault) ?? bots[0];
  }

  /** Add or update a bot entry. */
  register(entry: BotRegistryEntry): void {
    this.bots.set(entry.botName, entry);
  }

  /** Remove a bot entry. */
  unregister(botName: string): boolean {
    return this.bots.delete(botName);
  }

  /** Get all registered bot names. */
  allBotNames(): string[] {
    return Array.from(this.bots.keys());
  }

  /** Get all registered entries. */
  allEntries(): BotRegistryEntry[] {
    return Array.from(this.bots.values());
  }

  /**
   * Filter registry to only include bots that exist on Poe.
   * Call this after fetching /v1/models to remove stale entries.
   */
  filterByAvailable(availableBotNames: Set<string>): void {
    for (const [name] of this.bots) {
      if (!availableBotNames.has(name)) {
        this.bots.delete(name);
      }
    }
  }
}

/** Singleton registry with default catalog. */
export const defaultRegistry = new BotRegistry();
