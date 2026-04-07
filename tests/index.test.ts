import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import poePlugin from "../src/index.js";
import type { PluginApi } from "../src/types.js";

describe("Plugin entry point", () => {
  const originalEnv = process.env.POE_API_KEY;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.POE_API_KEY = originalEnv;
    } else {
      delete process.env.POE_API_KEY;
    }
  });

  it("has correct plugin metadata", () => {
    expect(poePlugin.id).toBe("poe");
    expect(poePlugin.name).toBe("Poe");
    expect(poePlugin.description).toContain("single API key");
  });

  it("registers text provider even without API key", () => {
    delete process.env.POE_API_KEY;

    const api: PluginApi = {
      registerProvider: vi.fn(),
      registerImageGenerationProvider: vi.fn(),
      registerVideoGenerationProvider: vi.fn(),
      registerSpeechProvider: vi.fn(),
      registerMusicGenerationProvider: vi.fn(),
    };

    poePlugin.register(api);

    expect(api.registerProvider).toHaveBeenCalledTimes(1);
    // Media providers should NOT be registered without key
    expect(api.registerImageGenerationProvider).not.toHaveBeenCalled();
    expect(api.registerVideoGenerationProvider).not.toHaveBeenCalled();
    expect(api.registerSpeechProvider).not.toHaveBeenCalled();
    expect(api.registerMusicGenerationProvider).not.toHaveBeenCalled();
  });

  it("registers all providers when API key is set", () => {
    process.env.POE_API_KEY = "test-key-123";

    const api: PluginApi = {
      registerProvider: vi.fn(),
      registerImageGenerationProvider: vi.fn(),
      registerVideoGenerationProvider: vi.fn(),
      registerSpeechProvider: vi.fn(),
      registerMusicGenerationProvider: vi.fn(),
    };

    poePlugin.register(api);

    expect(api.registerProvider).toHaveBeenCalledTimes(1);
    expect(api.registerImageGenerationProvider).toHaveBeenCalledTimes(1);
    expect(api.registerVideoGenerationProvider).toHaveBeenCalledTimes(1);
    expect(api.registerSpeechProvider).toHaveBeenCalledTimes(1);
    expect(api.registerMusicGenerationProvider).toHaveBeenCalledTimes(1);
  });

  it("gracefully handles missing registerMusicGenerationProvider", () => {
    process.env.POE_API_KEY = "test-key-123";

    const api: PluginApi = {
      registerProvider: vi.fn(),
      registerImageGenerationProvider: vi.fn(),
      registerVideoGenerationProvider: vi.fn(),
      registerSpeechProvider: vi.fn(),
      // Music registration not available (older OpenClaw version)
      registerMusicGenerationProvider: undefined,
    };

    // Should not throw
    expect(() => poePlugin.register(api)).not.toThrow();
    expect(api.registerProvider).toHaveBeenCalledTimes(1);
    expect(api.registerImageGenerationProvider).toHaveBeenCalledTimes(1);
  });

  it("registered text provider has correct id", () => {
    delete process.env.POE_API_KEY;

    let capturedProvider: any;
    const api: PluginApi = {
      registerProvider: vi.fn((p) => { capturedProvider = p; }),
      registerImageGenerationProvider: vi.fn(),
      registerVideoGenerationProvider: vi.fn(),
      registerSpeechProvider: vi.fn(),
      registerMusicGenerationProvider: vi.fn(),
    };

    poePlugin.register(api);

    expect(capturedProvider.id).toBe("poe");
    expect(capturedProvider.label).toBe("Poe");
    expect(capturedProvider.envVars).toContain("POE_API_KEY");
  });

  it("registered image provider has correct id", () => {
    process.env.POE_API_KEY = "test-key";

    let capturedProvider: any;
    const api: PluginApi = {
      registerProvider: vi.fn(),
      registerImageGenerationProvider: vi.fn((p) => { capturedProvider = p; }),
      registerVideoGenerationProvider: vi.fn(),
      registerSpeechProvider: vi.fn(),
      registerMusicGenerationProvider: vi.fn(),
    };

    poePlugin.register(api);

    expect(capturedProvider.id).toBe("poe");
    expect(capturedProvider.label).toBe("Poe Images");
    expect(capturedProvider.isConfigured({})).toBe(true);
    expect(capturedProvider.models.length).toBeGreaterThan(5);
  });
});
