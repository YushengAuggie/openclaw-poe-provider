import { describe, it, expect, beforeEach } from "vitest";
import { resolveModelForCapability, clearModelsCache } from "../src/models.js";
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
