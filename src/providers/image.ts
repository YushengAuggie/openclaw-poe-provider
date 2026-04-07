/**
 * Image generation provider for Poe.
 *
 * Uses Poe's OpenAI-compatible chat completions to call image bots.
 * Response content contains markdown image tags and/or raw CDN URLs.
 */

import type {
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageModel,
} from "../types.js";
import { PoeClient } from "../client.js";
import { extractImageUrls, downloadMedia } from "../adapters/media-extractor.js";
import { buildImagePrompt, validatePrompt } from "../adapters/param-mapper.js";
import { emptyResponseError, noMediaUrlError, wrapError } from "../errors.js";
import { resolveModelForCapability } from "../models.js";
import { defaultRegistry } from "../registry.js";

export function createImageProvider(apiKey: string): ImageGenerationProvider {
  const client = new PoeClient({ apiKey });

  const imageBots = defaultRegistry.byCapability("image");
  const models: ImageModel[] = imageBots.map((b) => ({
    id: b.botName,
    name: b.displayName,
    supportsEdit: b.supportsImageInput ?? false,
  }));

  return {
    id: "poe",
    label: "Poe Images",
    defaultModel: defaultRegistry.defaultFor("image")?.botName ?? "imagen-4-fast",
    models,

    isConfigured: () => Boolean(apiKey),

    async generate(req: ImageGenerationRequest): Promise<ImageGenerationResult> {
      const model = resolveModelForCapability(req.model, "image");
      const prompt = buildImagePrompt(req);
      validatePrompt(prompt, "Image generation");

      try {
        const response = await client.chatCompletion({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: false,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw emptyResponseError("Image", model);
        }

        const extracted = extractImageUrls(content);
        if (extracted.length === 0) {
          throw noMediaUrlError("Image", model, content);
        }

        // Download images to buffers
        const count = req.count ?? 1;
        const imagesToProcess = extracted.slice(0, count);

        const images = await Promise.all(
          imagesToProcess.map(async (img) => {
            try {
              const { buffer, contentType } = await downloadMedia(img.url);
              return {
                url: img.url,
                buffer,
                mimeType: contentType,
                revisedPrompt: img.altText,
              };
            } catch {
              // If download fails, return URL-only result (graceful degradation)
              return { url: img.url, revisedPrompt: img.altText };
            }
          }),
        );

        return { images };
      } catch (err) {
        throw wrapError(err, `Image generation with ${model}`);
      }
    },
  };
}
