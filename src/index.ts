/**
 * OpenClaw Poe Provider Plugin — Entry Point
 *
 * Registers all Poe capabilities under one plugin:
 * - Text/LLM (hundreds of models via OpenAI-compatible API)
 * - Image generation (Imagen, GPT Image, Flux, Seedream, DALL-E, etc.)
 * - Video generation (Veo, Runway, Kling, Seedance, etc.)
 * - Speech/TTS (ElevenLabs, Gemini TTS, GPT Audio, etc.)
 * - Music generation (Lyria, Stable Audio, ElevenLabs Music, etc.)
 *
 * All from a single POE_API_KEY.
 */

import type { PluginEntry } from "./types.js";
import { createTextProvider } from "./providers/text.js";
import { createImageProvider } from "./providers/image.js";
import { createVideoProvider } from "./providers/video.js";
import { createSpeechProvider } from "./providers/speech.js";
import { createMusicProvider } from "./providers/music.js";

const poePlugin: PluginEntry = {
  id: "poe",
  name: "Poe",
  description:
    "All-in-one AI provider via Poe API — text, image, video, TTS, and music from a single API key",

  register(api) {
    // Resolve API key from environment
    const apiKey = process.env.POE_API_KEY ?? "";

    // 1. Text/LLM provider (always register — catalog checks key at runtime)
    api.registerProvider(createTextProvider());

    // 2-5. Media providers (register when key is available)
    if (apiKey) {
      api.registerImageGenerationProvider(createImageProvider(apiKey));
      api.registerVideoGenerationProvider(createVideoProvider(apiKey));
      api.registerSpeechProvider(createSpeechProvider(apiKey));

      // Music generation is optional (not all OpenClaw versions support it)
      if (api.registerMusicGenerationProvider) {
        api.registerMusicGenerationProvider(createMusicProvider(apiKey));
      }
    }
  },
};

export default poePlugin;

// Re-export for direct imports
export { createTextProvider } from "./providers/text.js";
export { createImageProvider } from "./providers/image.js";
export { createVideoProvider } from "./providers/video.js";
export { createSpeechProvider } from "./providers/speech.js";
export { createMusicProvider } from "./providers/music.js";
export { PoeClient, PoeApiError } from "./client.js";
export { BotRegistry, defaultRegistry } from "./registry.js";
export type * from "./types.js";
