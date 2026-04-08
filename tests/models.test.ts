import { describe, it, expect, beforeEach } from "vitest";
import { resolveModelForCapability, clearModelsCache, TEXT_MODELS } from "../src/models.js";
import { BotRegistry } from "../src/registry.js";

describe("resolveModelForCapability", () => {
  beforeEach(() => clearModelsCache());

  it("returns requested model if in registry", () => {
    const registry = new BotRegistry();
    const model = resolveModelForCapability("imagen-4", "image", registry);
    expect(model).toBe("imagen-4");
  });

  it("strips poe/ prefix from requested model", () => {
    const registry = new BotRegistry();
    const model = resolveModelForCapability("poe/veo-3", "video", registry);
    expect(model).toBe("veo-3");
  });

  it("returns requested model even if not in registry (new bot)", () => {
    const registry = new BotRegistry([]);
    const model = resolveModelForCapability("new-bot-2026", "image", registry);
    expect(model).toBe("new-bot-2026");
  });

  it("falls back to default when no model requested", () => {
    const registry = new BotRegistry();
    const model = resolveModelForCapability(undefined, "image", registry);
    expect(model).toBe("imagen-4"); // isDefault: true
  });

  it("falls back to hardcoded default with empty registry", () => {
    const registry = new BotRegistry([]);
    expect(resolveModelForCapability(undefined, "image", registry)).toBe("imagen-4-fast");
    expect(resolveModelForCapability(undefined, "video", registry)).toBe("veo-3-fast");
    expect(resolveModelForCapability(undefined, "speech", registry)).toBe("elevenlabs-v3");
    expect(resolveModelForCapability(undefined, "music", registry)).toBe("lyria-3");
  });
});

describe("TEXT_MODELS", () => {
  it("is a non-empty array", () => {
    expect(TEXT_MODELS.length).toBeGreaterThan(0);
  });

  it("all entries have required fields", () => {
    for (const model of TEXT_MODELS) {
      expect(model.id).toBeDefined();
      expect(typeof model.id).toBe("string");
      expect(model.id.length).toBeGreaterThan(0);

      expect(model.name).toBeDefined();
      expect(typeof model.name).toBe("string");
      expect(model.name.length).toBeGreaterThan(0);

      expect(typeof model.reasoning).toBe("boolean");

      expect(Array.isArray(model.input)).toBe(true);
      expect(model.input!.length).toBeGreaterThan(0);

      expect(typeof model.contextWindow).toBe("number");
      expect(model.contextWindow!).toBeGreaterThan(0);

      expect(typeof model.maxTokens).toBe("number");
      expect(model.maxTokens!).toBeGreaterThan(0);
    }
  });

  it("has no duplicate IDs", () => {
    const ids = TEXT_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
