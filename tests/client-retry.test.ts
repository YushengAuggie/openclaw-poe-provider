import { describe, it, expect, vi, beforeEach } from "vitest";
import { PoeClient, PoeApiError } from "../src/client.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("PoeClient advanced retry scenarios", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("retries on 500 server error", async () => {
    // First: 500, second: success
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => '{"error":{"message":"Internal error"}}',
      })
      .mockResolvedValueOnce({
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

  it("retries on network error then succeeds", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "recovered" } }] }),
      });

    const client = new PoeClient({ apiKey: "key" });
    const result = await client.chatCompletion({
      model: "test",
      messages: [],
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.choices[0].message.content).toBe("recovered");
  });

  it("throws after max retries exhausted on 500", async () => {
    // 4 consecutive 500s (1 original + 3 retries)
    for (let i = 0; i < 4; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => '{"error":{"message":"Server down"}}',
      });
    }

    const client = new PoeClient({ apiKey: "key" });
    await expect(
      client.chatCompletion({ model: "test", messages: [] }),
    ).rejects.toThrow("Server down");

    expect(mockFetch).toHaveBeenCalledTimes(4); // 1 + 3 retries
  }, 15000);

  it("throws after max retries exhausted on network errors", async () => {
    for (let i = 0; i < 4; i++) {
      mockFetch.mockRejectedValueOnce(new Error("Network unreachable"));
    }

    const client = new PoeClient({ apiKey: "key" });
    const err = await client
      .chatCompletion({ model: "test", messages: [] })
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(PoeApiError);
    expect((err as PoeApiError).message).toContain("Network");
    expect(mockFetch).toHaveBeenCalledTimes(4);
  }, 15000);

  it("extra_body cannot override reserved keys", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    const client = new PoeClient({ apiKey: "key" });
    await client.chatCompletion({
      model: "correct-model",
      messages: [{ role: "user", content: "hi" }],
      stream: false,
      extra_body: {
        model: "hacked-model",
        stream: true,
        custom_param: "ok",
      },
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("correct-model"); // Reserved key wins
    expect(body.stream).toBe(false); // Reserved key wins
    expect(body.custom_param).toBe("ok"); // Custom param preserved
  });
});
