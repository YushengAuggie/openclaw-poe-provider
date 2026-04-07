/**
 * Video generation provider for Poe.
 *
 * Poe video bots return a CDN URL when the video is ready.
 * The API call blocks until generation completes (can take 30s-5min).
 */

import type {
  VideoGenerationProvider,
  VideoGenerationRequest,
  VideoGenerationResult,
  VideoModel,
} from "../types.js";
import { PoeClient, PoeApiError } from "../client.js";
import { extractVideoUrl, downloadMedia } from "../adapters/media-extractor.js";
import { resolveModelForCapability } from "../models.js";
import { defaultRegistry } from "../registry.js";

export function createVideoProvider(apiKey: string): VideoGenerationProvider {
  const client = new PoeClient({
    apiKey,
    timeoutMs: 300_000, // 5 minute timeout for video generation
  });

  const videoBots = defaultRegistry.byCapability("video");
  const models: VideoModel[] = videoBots.map((b) => ({
    id: b.botName,
    name: b.displayName,
  }));

  return {
    id: "poe",
    label: "Poe Video",
    defaultModel: defaultRegistry.defaultFor("video")?.botName ?? "veo-3-fast",
    models,

    capabilities: {
      maxImages: 1,
      maxVideos: 0,
      maxDurationSeconds: 30,
      supportsResolution: false,
      supportsAspectRatio: false,
      supportsAudio: false,
    },

    isConfigured: () => Boolean(apiKey),

    async generateVideo(req: VideoGenerationRequest): Promise<VideoGenerationResult> {
      const model = resolveModelForCapability(req.model, "video");

      let prompt = req.prompt;
      if (req.durationSeconds) prompt += ` [duration: ${req.durationSeconds}s]`;
      if (req.aspectRatio) prompt += ` [aspect ratio: ${req.aspectRatio}]`;

      const response = await client.chatCompletion({
        model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new PoeApiError("Empty response from video bot", 500);
      }

      const extracted = extractVideoUrl(content);
      if (!extracted) {
        throw new PoeApiError(
          `Video bot "${model}" returned no video URL. Response: ${content.substring(0, 200)}`,
          500,
        );
      }

      try {
        const { buffer, contentType } = await downloadMedia(
          extracted.url,
          120_000,
        );
        return {
          videos: [
            {
              url: extracted.url,
              buffer,
              mimeType: contentType,
            },
          ],
        };
      } catch {
        return { videos: [{ url: extracted.url }] };
      }
    },
  };
}
