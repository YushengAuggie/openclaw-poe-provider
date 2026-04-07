import { describe, it, expect } from "vitest";
import { BotRegistry } from "../src/registry.js";

describe("BotRegistry", () => {
  it("creates with default catalog", () => {
    const registry = new BotRegistry();
    expect(registry.allBotNames().length).toBeGreaterThan(30);
  });

  it("filters by capability", () => {
    const registry = new BotRegistry();
    const imageBots = registry.byCapability("image");
    expect(imageBots.length).toBeGreaterThan(5);
    expect(imageBots.every((b) => b.capability === "image")).toBe(true);
  });

  it("returns default bot for capability", () => {
    const registry = new BotRegistry();
    const defaultImage = registry.defaultFor("image");
    expect(defaultImage).toBeDefined();
    expect(defaultImage!.isDefault).toBe(true);
    expect(defaultImage!.capability).toBe("image");
  });

  it("registers new bots", () => {
    const registry = new BotRegistry([]);
    registry.register({
      botName: "test-bot",
      displayName: "Test Bot",
      capability: "image",
    });
    expect(registry.has("test-bot")).toBe(true);
    expect(registry.get("test-bot")!.displayName).toBe("Test Bot");
  });

  it("unregisters bots", () => {
    const registry = new BotRegistry([
      { botName: "bot-a", displayName: "A", capability: "image" },
      { botName: "bot-b", displayName: "B", capability: "video" },
    ]);
    expect(registry.unregister("bot-a")).toBe(true);
    expect(registry.has("bot-a")).toBe(false);
    expect(registry.has("bot-b")).toBe(true);
  });

  it("filters by available models", () => {
    const registry = new BotRegistry([
      { botName: "exists", displayName: "Exists", capability: "image" },
      { botName: "removed", displayName: "Removed", capability: "image" },
    ]);
    registry.filterByAvailable(new Set(["exists"]));
    expect(registry.has("exists")).toBe(true);
    expect(registry.has("removed")).toBe(false);
  });

  it("returns all capabilities", () => {
    const registry = new BotRegistry();
    const speech = registry.byCapability("speech");
    const video = registry.byCapability("video");
    const music = registry.byCapability("music");
    expect(speech.length).toBeGreaterThan(0);
    expect(video.length).toBeGreaterThan(0);
    expect(music.length).toBeGreaterThan(0);
  });

  it("handles empty registry gracefully", () => {
    const registry = new BotRegistry([]);
    expect(registry.byCapability("image")).toEqual([]);
    expect(registry.defaultFor("image")).toBeUndefined();
    expect(registry.allBotNames()).toEqual([]);
  });
});
