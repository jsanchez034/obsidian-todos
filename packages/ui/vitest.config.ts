import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    css: false,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@obsidian-todos/ui": new URL("./src", import.meta.url).pathname,
    },
  },
});
