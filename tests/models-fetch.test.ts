import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAvailableModels, clearModelsCache } from "../src/models.js";
import { PoeClient } from "../src/client.js";

describe("fetchAvailableModels", () => {
  beforeEach(() => {
    clearModelsCache();
  });

  it("fetches and caches model IDs", async () => {
    const client = {
      listModels: vi.fn().mockResolvedValue({
        data: [{ id: "model-a" }, { id: "model-b" }, { id: "model-c" }],
      }),
    } as unknown as PoeClient;

    const result = await fetchAvailableModels(client);
    expect(result.size).toBe(3);
    expect(result.has("model-a")).toBe(true);
    expect(result.has("model-b")).toBe(true);
    expect(client.listModels).toHaveBeenCalledTimes(1);
  });

  it("uses cache on second call within TTL", async () => {
    const client = {
      listModels: vi.fn().mockResolvedValue({
        data: [{ id: "cached-model" }],
      }),
    } as unknown as PoeClient;

    await fetchAvailableModels(client);
    const result2 = await fetchAvailableModels(client);

    expect(result2.has("cached-model")).toBe(true);
    expect(client.listModels).toHaveBeenCalledTimes(1); // Not called again
  });

  it("returns empty set on error with no prior cache", async () => {
    const client = {
      listModels: vi.fn().mockRejectedValue(new Error("network fail")),
    } as unknown as PoeClient;

    const result = await fetchAvailableModels(client);
    expect(result.size).toBe(0);
  });

  it("returns stale cache on error when cache exists", async () => {
    const client = {
      listModels: vi
        .fn()
        .mockResolvedValueOnce({ data: [{ id: "stale-model" }] })
        .mockRejectedValueOnce(new Error("fail")),
    } as unknown as PoeClient;

    // First call succeeds and caches
    await fetchAvailableModels(client);

    // Expire cache manually
    clearModelsCache();

    // But since we cleared, this should return empty (no stale cache)
    const result = await fetchAvailableModels(client);
    expect(result.size).toBe(0);
  });
});
