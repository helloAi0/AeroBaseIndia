import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so the app build/typecheck never depends on vitest's bundled vite types.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: { environment: "jsdom", include: ["src/**/*.test.{ts,tsx}"], setupFiles: ["./src/test/setup.ts"] },
});
