/**
 * Speech/TTS provider for Poe.
 *
 * Uses Poe's TTS bots (ElevenLabs, Gemini TTS, GPT Audio, etc.)
 * Bots return an audio CDN URL.
 */

import type {
  SpeechProvider,
  SpeechSynthesisRequest,
  SpeechSynthesisResult,
} from "../types.js";
import { PoeClient } from "../client.js";
import { extractAudioUrl, downloadMedia } from "../adapters/media-extractor.js";
import { emptyResponseError, noMediaUrlError, wrapError } from "../errors.js";
import { resolveModelForCapability } from "../models.js";

export function createSpeechProvider(apiKey: string): SpeechProvider {
  const client = new PoeClient({ apiKey, timeoutMs: 60_000 });

  return {
    id: "poe",
    label: "Poe Speech",

    isConfigured: () => Boolean(apiKey),

    async synthesize(req: SpeechSynthesisRequest): Promise<SpeechSynthesisResult> {
      const model = resolveModelForCapability(req.model, "speech");

      if (!req.text?.trim()) {
        throw new Error("Speech synthesis: text cannot be empty");
      }

      try {
        const response = await client.chatCompletion({
          model,
          messages: [{ role: "user", content: req.text }],
          stream: false,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw emptyResponseError("TTS", model);
        }

        const extracted = extractAudioUrl(content);
        if (!extracted) {
          throw noMediaUrlError("TTS", model, content);
        }

        const { buffer, contentType } = await downloadMedia(extracted.url);

        // Determine output format from content type
        let outputFormat = "mp3";
        let fileExtension = ".mp3";
        if (contentType.includes("opus") || contentType.includes("ogg")) {
          outputFormat = "opus";
          fileExtension = ".ogg";
        } else if (contentType.includes("wav")) {
          outputFormat = "wav";
          fileExtension = ".wav";
        }

        return {
          audioBuffer: buffer,
          outputFormat,
          fileExtension,
          voiceCompatible: outputFormat === "opus",
        };
      } catch (err) {
        throw wrapError(err, `Speech synthesis with ${model}`);
      }
    },
  };
}
