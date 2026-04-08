import { describe, it, expect, vi, beforeEach } from "vitest";
import { PoeClient, PoeApiError } from "../src/client.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("PoeClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("sends correct auth header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "hi" } }] }),
    });

    const client = new PoeClient({ apiKey: "test-key-123" });
    await client.chatCompletion({
      model: "test",
      messages: [{ role: "user", content: "hi" }],
    });

    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer test-key-123",
    );
  });

  it("sends non-streaming request by default", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "hi" } }] }),
    });

    const client = new PoeClient({ apiKey: "key" });
    await client.chatCompletion({
      model: "test",
      messages: [{ role: "user", content: "hi" }],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.stream).toBe(false);
  });

  it("uses correct base URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    const client = new PoeClient({ apiKey: "key" });
    await client.chatCompletion({
      model: "test",
      messages: [],
    });

    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://api.poe.com/v1/chat/completions",
    );
  });

  it("supports custom base URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    const client = new PoeClient({
      apiKey: "key",
      baseUrl: "https://custom.api.com/v1",
    });
    await client.chatCompletion({ model: "test", messages: [] });

    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://custom.api.com/v1/chat/completions",
    );
  });

  it("calls /v1/models for listModels", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: "model-1" }] }),
    });

    const client = new PoeClient({ apiKey: "key" });
    const result = await client.listModels();

    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://api.poe.com/v1/models",
    );
    expect(result.data).toHaveLength(1);
  });
});

describe("PoeApiError", () => {
  it("provides user message for 401", () => {
    const err = new PoeApiError("Unauthorized", 401);
    expect(err.userMessage).toContain("poe.com/api_key");
  });

  it("provides user message for 402 (insufficient points)", () => {
    const err = new PoeApiError("insufficient compute points", 402);
    expect(err.userMessage).toContain("poe.com/settings/billing");
  });

  it("provides billing link for 402 with 'insufficient' in message", () => {
    const err = new PoeApiError("insufficient compute points", 402);
    expect(err.userMessage).toContain("poe.com/settings/billing");
    expect(err.userMessage).toContain("compute points exhausted");
  });

  it("provides billing link for non-402 with 'insufficient' in message", () => {
    // The userMessage getter checks statusCode === 402 OR message includes "insufficient"
    const err = new PoeApiError("insufficient balance", 200);
    expect(err.userMessage).toContain("poe.com/settings/billing");
  });

  it("provides user message for 429", () => {
    const err = new PoeApiError("Too many requests", 429);
    expect(err.userMessage).toContain("rate limit");
  });

  it("provides user message for 500+", () => {
    const err = new PoeApiError("Internal error", 500);
    expect(err.userMessage).toContain("temporarily unavailable");
  });

  it("provides generic message for other errors", () => {
    const err = new PoeApiError("Bad request", 400);
    expect(err.userMessage).toContain("Bad request");
  });
});

describe("PoeClient retry", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("retries on 429", async () => {
    // First call: 429
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => '{"error":{"message":"Rate limited"}}',
    });
    // Second call: success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    });

    const client = new PoeClient({ apiKey: "key" });
    const result = await client.chatCompletion({
      model: "test",
      messages: [{ role: "user", content: "hi" }],
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.choices[0].message.content).toBe("ok");
  });

  it("does not retry on 400", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => '{"error":{"message":"Bad request"}}',
    });

    const client = new PoeClient({ apiKey: "key" });
    await expect(
      client.chatCompletion({
        model: "test",
        messages: [],
      }),
    ).rejects.toThrow("Bad request");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
