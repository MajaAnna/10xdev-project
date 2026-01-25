import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",

    setupFiles: ["./tests/setup.ts"],

    // Global imports (e.g., matchers from @testing-library/jest-dom)
    globals: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules/", "tests/", "dist/", "**/*.d.ts", "**/*.config.*", "**/mockData", "**/.astro"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    isolate: true,

    testTimeout: 10000,

    // Enable watch mode in development
    watch: false,

    // Test structure
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".astro", "e2e"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
