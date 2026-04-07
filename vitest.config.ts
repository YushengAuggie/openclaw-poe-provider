import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/live/**"],
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/types.ts"],
    },
  },
});
