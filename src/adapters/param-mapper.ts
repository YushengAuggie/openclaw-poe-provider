/**
 * Parameter mapping: OpenClaw request → Poe bot prompt.
 *
 * Reviewer feedback addressed:
 * - Staff Eng: Split utils.ts into focused modules
 * - Architect: Clean separation between OpenClaw params and Poe prompt format
 *
 * Poe media bots accept hints as bracketed text in the prompt.
 * This module handles the translation cleanly.
 */

import type {
  ImageGenerationRequest,
  VideoGenerationRequest,
  MusicGenerationRequest,
} from "../types.js";

/**
 * Build the prompt string for an image generation bot.
 */
export function buildImagePrompt(req: ImageGenerationRequest): string {
  const parts: string[] = [req.prompt];

  if (req.aspectRatio) {
    parts.push(`[aspect ratio: ${req.aspectRatio}]`);
  }
  if (req.size) {
    parts.push(`[size: ${req.size}]`);
  }
  if (req.count && req.count > 1) {
    parts.push(`[count: ${req.count}]`);
  }

  return parts.join(" ");
}

/**
 * Build the prompt string for a video generation bot.
 */
export function buildVideoPrompt(req: VideoGenerationRequest): string {
  const parts: string[] = [req.prompt];

  if (req.durationSeconds) {
    parts.push(`[duration: ${req.durationSeconds}s]`);
  }
  if (req.aspectRatio) {
    parts.push(`[aspect ratio: ${req.aspectRatio}]`);
  }
  if (req.resolution) {
    parts.push(`[resolution: ${req.resolution}]`);
  }

  return parts.join(" ");
}

/**
 * Build the prompt string for a music generation bot.
 */
export function buildMusicPrompt(req: MusicGenerationRequest): string {
  const parts: string[] = [req.prompt];

  if (req.instrumental) {
    parts.push("[instrumental only, no vocals]");
  }
  if (req.durationSeconds) {
    parts.push(`[duration: ${req.durationSeconds}s]`);
  }

  let prompt = parts.join(" ");

  // Append lyrics as a separate section if provided
  if (req.lyrics) {
    prompt += `\n\nLyrics:\n${req.lyrics}`;
  }

  return prompt;
}

import { validationError } from "../errors.js";

/**
 * Validate that a prompt is not empty or trivially short.
 * Throws a 400-class PoeApiError (not a generic Error).
 */
export function validatePrompt(prompt: string, context: string): void {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw validationError(`${context}: prompt cannot be empty`);
  }
  if (trimmed.length < 2) {
    throw validationError(
      `${context}: prompt too short (${trimmed.length} chars). Please provide a more descriptive prompt.`,
    );
  }
}
