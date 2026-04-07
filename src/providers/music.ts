/**
 * Music generation provider for Poe.
 *
 * Uses Poe's music bots (Lyria, ElevenLabs Music, Stable Audio, etc.)
 * Bots return a description/caption followed by an audio CDN URL.
 */

import type {
  MusicGenerationProvider,
  MusicGenerationRequest,
  MusicGenerationResult,
  MusicModel,
} from "../types.js";
import { PoeClient, PoeApiError } from "../client.js";
import { extractMusicData, downloadMedia } from "../adapters/media-extractor.js";
import { resolveModelForCapability } from "../models.js";
import { defaultRegistry } from "../registry.js";

export function createMusicProvider(apiKey: string): MusicGenerationProvider {
  const client = new PoeClient({ apiKey, timeoutMs: 120_000 });

  const musicBots = defaultRegistry.byCapability("music");
  const models: MusicModel[] = musicBots.map((b) => ({
    id: b.botName,
    name: b.displayName,
  }));

  return {
    id: "poe",
    label: "Poe Music",
    defaultModel: defaultRegistry.defaultFor("music")?.botName ?? "lyria-3",
    models,

    isConfigured: () => Boolean(apiKey),

    async generate(req: MusicGenerationRequest): Promise<MusicGenerationResult> {
      const model = resolveModelForCapability(req.model, "music");

      let prompt = req.prompt;
      if (req.instrumental) prompt += " [instrumental only, no vocals]";
      if (req.durationSeconds) prompt += ` [duration: ${req.durationSeconds}s]`;

      // If lyrics are provided, include them
      if (req.lyrics) {
        prompt += `\n\nLyrics:\n${req.lyrics}`;
      }

      const response = await client.chatCompletion({
        model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new PoeApiError("Empty response from music bot", 500);
      }

      const extracted = extractMusicData(content);
      if (!extracted) {
        throw new PoeApiError(
          `Music bot "${model}" returned no audio URL. Response: ${content.substring(0, 200)}`,
          500,
        );
      }

      const { buffer, contentType } = await downloadMedia(extracted.url);

      return {
        audio: {
          url: extracted.url,
          buffer,
          mimeType: contentType,
        },
        description: extracted.description,
      };
    },
  };
}
