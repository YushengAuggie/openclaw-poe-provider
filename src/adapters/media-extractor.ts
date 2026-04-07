/**
 * Media URL extraction from Poe bot responses.
 *
 * Poe media bots return content in a standard chat completion format, but
 * the `content` field contains URLs to generated media. The exact format
 * varies by media type:
 *
 * - **Image:** Markdown image tag + raw URL
 *   `![desc](https://pfst.cf2.poecdn.net/base/image/...)\n\nhttps://...`
 *
 * - **Audio (TTS):** Plain URL
 *   `https://pfst.cf2.poecdn.net/base/audio/...`
 *
 * - **Audio (Music):** Description text + URL
 *   `Caption: ...\n\nhttps://pfst.cf2.poecdn.net/base/audio/...`
 *
 * - **Video:** Plain URL
 *   `https://pfst.cf2.poecdn.net/base/video/...`
 */

const POE_CDN_PATTERN =
  /https:\/\/pfst\.cf2\.poecdn\.net\/base\/(?:image|audio|video)\/[a-f0-9]+(?:\?[^\s)]*)?/g;

const MARKDOWN_IMAGE_PATTERN =
  /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;

const GENERIC_URL_PATTERN =
  /https?:\/\/[^\s"'<>]+/g;

export interface ExtractedImage {
  url: string;
  altText?: string;
}

export interface ExtractedAudio {
  url: string;
}

export interface ExtractedVideo {
  url: string;
}

export interface ExtractedMusic {
  url: string;
  description?: string;
}

/**
 * Extract image URLs from a Poe image bot response.
 * Returns unique URLs (markdown images may be duplicated as raw URLs).
 */
export function extractImageUrls(content: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  const seenUrls = new Set<string>();

  // First try markdown images
  let match: RegExpExecArray | null;
  const mdPattern = new RegExp(MARKDOWN_IMAGE_PATTERN.source, "g");
  while ((match = mdPattern.exec(content)) !== null) {
    const url = match[2];
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      images.push({ url, altText: match[1] || undefined });
    }
  }

  // Then try raw URLs pointing to /base/image/
  const cdnPattern = new RegExp(POE_CDN_PATTERN.source, "g");
  while ((match = cdnPattern.exec(content)) !== null) {
    if (match[0].includes("/base/image/") && !seenUrls.has(match[0])) {
      seenUrls.add(match[0]);
      images.push({ url: match[0] });
    }
  }

  // Fallback: any URL that looks like an image (common extensions)
  if (images.length === 0) {
    const urlPattern = new RegExp(GENERIC_URL_PATTERN.source, "g");
    while ((match = urlPattern.exec(content)) !== null) {
      const url = match[0];
      if (
        /\.(png|jpg|jpeg|gif|webp|svg)/i.test(url) &&
        !seenUrls.has(url)
      ) {
        seenUrls.add(url);
        images.push({ url });
      }
    }
  }

  return images;
}

/**
 * Extract audio URL from a Poe TTS bot response.
 * TTS bots return a plain audio CDN URL.
 */
export function extractAudioUrl(content: string): ExtractedAudio | null {
  const cdnPattern = new RegExp(POE_CDN_PATTERN.source, "g");
  let match: RegExpExecArray | null;

  while ((match = cdnPattern.exec(content)) !== null) {
    if (match[0].includes("/base/audio/")) {
      return { url: match[0] };
    }
  }

  // Fallback: any URL with audio extensions or /audio/ path
  const urlPattern = new RegExp(GENERIC_URL_PATTERN.source, "g");
  while ((match = urlPattern.exec(content)) !== null) {
    const url = match[0];
    if (/\.(mp3|wav|ogg|opus|m4a|flac|aac)/i.test(url) || /\/audio\//i.test(url)) {
      return { url };
    }
  }

  return null;
}

/**
 * Extract video URL from a Poe video bot response.
 * Video bots return a plain video CDN URL.
 */
export function extractVideoUrl(content: string): ExtractedVideo | null {
  const cdnPattern = new RegExp(POE_CDN_PATTERN.source, "g");
  let match: RegExpExecArray | null;

  while ((match = cdnPattern.exec(content)) !== null) {
    if (match[0].includes("/base/video/")) {
      return { url: match[0] };
    }
  }

  // Fallback: any URL with video extensions or /video/ path
  const urlPattern = new RegExp(GENERIC_URL_PATTERN.source, "g");
  while ((match = urlPattern.exec(content)) !== null) {
    const url = match[0];
    if (/\.(mp4|webm|mov|avi|mkv)/i.test(url) || /\/video\//i.test(url)) {
      return { url };
    }
  }

  return null;
}

/**
 * Extract music audio URL and description from a Poe music bot response.
 * Music bots return a caption/description followed by an audio URL.
 */
export function extractMusicData(content: string): ExtractedMusic | null {
  const audio = extractAudioUrl(content);
  if (!audio) return null;

  // Extract description: everything before the audio URL, cleaned up
  const audioUrlIndex = content.indexOf(audio.url);
  let description: string | undefined;

  if (audioUrlIndex > 0) {
    const rawDescription = content.substring(0, audioUrlIndex).trim();
    // Clean up "Caption: " prefix if present
    description = rawDescription
      .replace(/^Caption:\s*/i, "")
      .replace(/\n+$/, "")
      .trim();
    if (!description) description = undefined;
  }

  return { url: audio.url, description };
}

/**
 * Check if the response content contains any media URLs.
 * Useful for determining if a response is media or text.
 */
export function hasMediaContent(content: string): boolean {
  return (
    new RegExp(POE_CDN_PATTERN.source).test(content) ||
    new RegExp(MARKDOWN_IMAGE_PATTERN.source).test(content)
  );
}

/**
 * Download media from a URL and return as a Buffer.
 */
export async function downloadMedia(
  url: string,
  timeoutMs = 60_000,
): Promise<{ buffer: Buffer; contentType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to download media: HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    };
  } finally {
    clearTimeout(timeout);
  }
}
