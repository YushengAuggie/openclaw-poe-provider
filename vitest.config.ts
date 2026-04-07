import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: process.env.TEST_POE_LIVE === "1" ? [] : ["tests/live/**"],
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/types.ts"],
    },
  },
});
