/**
 * Shared Poe API client.
 *
 * Wraps fetch calls to the Poe OpenAI-compatible endpoint with retry/backoff,
 * error mapping, and media-specific request options.
 */

import type { PoeApiResponse, PoeModelsResponse } from "./types.js";

const POE_BASE_URL = "https://api.poe.com/v1";
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

export interface PoeClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  extra_body?: Record<string, unknown>;
}

export class PoeApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly poeErrorCode?: string,
    public readonly isRetryable: boolean = false,
  ) {
    super(message);
    this.name = "PoeApiError";
  }

  /** User-facing error message with actionable context. */
  get userMessage(): string {
    if (this.statusCode === 401) {
      return "Invalid Poe API key. Get yours at poe.com/api_key";
    }
    if (this.statusCode === 402 || this.message.includes("insufficient")) {
      return "Poe compute points exhausted. Top up at poe.com/settings/billing";
    }
    if (this.statusCode === 429) {
      return "Poe rate limit reached. Please wait a moment and try again.";
    }
    if (this.statusCode >= 500) {
      return "Poe API is temporarily unavailable. Please try again later.";
    }
    return `Poe API error: ${this.message}`;
  }
}

export class PoeClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: PoeClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? POE_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Send a chat completion request (non-streaming).
   * Used for media bots — they return URLs/content in the response.
   */
  async chatCompletion(req: ChatCompletionRequest): Promise<PoeApiResponse> {
    const body: Record<string, unknown> = {
      ...req.extra_body,
      // Reserved keys always win — spread extra_body first
      model: req.model,
      messages: req.messages,
      stream: req.stream ?? false,
    };

    return this.fetchWithRetry<PoeApiResponse>(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  }

  /** List available models from Poe's /v1/models endpoint. */
  async listModels(): Promise<PoeModelsResponse> {
    return this.fetchWithRetry<PoeModelsResponse>(`${this.baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  /** Fetch with retry + exponential backoff for retryable errors. */
  private async fetchWithRetry<T>(
    url: string,
    init: RequestInit,
    attempt = 0,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        let errorMsg = `HTTP ${response.status}`;
        let poeCode: string | undefined;

        try {
          const parsed = JSON.parse(errorBody);
          errorMsg = parsed?.error?.message ?? errorMsg;
          poeCode = parsed?.error?.code;
        } catch {
          if (errorBody) errorMsg = errorBody;
        }

        const isRetryable =
          response.status === 429 ||
          response.status >= 500;

        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_MS * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
          return this.fetchWithRetry<T>(url, init, attempt + 1);
        }

        throw new PoeApiError(errorMsg, response.status, poeCode, isRetryable);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof PoeApiError) throw error;

      // Retry timeout and network errors with backoff
      const isTimeout =
        error instanceof DOMException && error.name === "AbortError";
      const isNetworkError = !isTimeout && !(error instanceof PoeApiError);

      if ((isTimeout || isNetworkError) && attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        return this.fetchWithRetry<T>(url, init, attempt + 1);
      }

      if (isTimeout) {
        throw new PoeApiError(
          `Request timed out after ${this.timeoutMs}ms`,
          408,
          "timeout",
          true,
        );
      }
      throw new PoeApiError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
        0,
        "network_error",
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
