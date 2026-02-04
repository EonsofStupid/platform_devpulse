import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: resolve(__dirname, "./src/lib"),
    },
  },
  test: {
    include: ["src/lib/**/*.{test,spec}.{js,ts}"],
    setupFiles: ["vitest-browser-svelte"],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      headless: false,
      api: {
        host: "127.0.0.1",
        port: 51205,
      },
    },
  },
});
