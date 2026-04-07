import { describe, it, expect } from "vitest";
import { createTextProvider } from "../../src/providers/text.js";

describe("createTextProvider", () => {
  const provider = createTextProvider();

  it("has correct provider id", () => {
    expect(provider.id).toBe("poe");
  });

  it("has correct label", () => {
    expect(provider.label).toBe("Poe");
  });

  it("requires POE_API_KEY", () => {
    expect(provider.envVars).toContain("POE_API_KEY");
  });

  it("returns null catalog when no key", async () => {
    const result = await provider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: undefined }),
    });
    expect(result).toBeNull();
  });

  it("returns catalog with models when key is present", async () => {
    const result = await provider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
    });
    expect(result).not.toBeNull();
    expect(result!.provider.models.length).toBeGreaterThan(5);
    expect(result!.provider.baseUrl).toBe("https://api.poe.com/v1");
    expect(result!.provider.api).toBe("openai-completions");
  });

  it("resolves dynamic models", () => {
    const model = provider.resolveDynamicModel!({ modelId: "some-new-bot" });
    expect(model).not.toBeNull();
    expect(model!.id).toBe("some-new-bot");
    expect(model!.provider).toBe("poe");
    expect(model!.api).toBe("openai-completions");
  });

  it("includes vision-capable models", async () => {
    const result = await provider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
    });
    const claudeOpus = result!.provider.models.find(
      (m) => m.id === "claude-opus-4-6",
    );
    expect(claudeOpus).toBeDefined();
    expect(claudeOpus!.input).toContain("image");
  });

  it("includes reasoning models", async () => {
    const result = await provider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
    });
    const claudeOpus = result!.provider.models.find(
      (m) => m.id === "claude-opus-4-6",
    );
    expect(claudeOpus!.reasoning).toBe(true);
  });
});
