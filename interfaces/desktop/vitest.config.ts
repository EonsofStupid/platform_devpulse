/**
 * @file vitest.config.ts
 * @package @devpulse/coldlight
 *
 * Vitest 4 configuration — browser mode (Chromium via Playwright).
 *
 * Node 24 minimum. Svelte 5 runes. Zero stores.
 *
 * Dev:  headed browser, no coverage, no traces
 * CI:   headless, coverage v8, traces on failure, screenshot on failure
 *
 * ```mermaid
 * flowchart LR
 *   Test[*.test.ts] --> Vitest[Vitest 4]
 *   Vitest --> Browser[Chromium via Playwright]
 *   Browser --> DOM[Real DOM]
 *   Vitest --> Coverage[V8 Coverage]
 *   Coverage --> Report[HTML + LCOV]
 * ```
 */

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isCI = !!process.env.CI;
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: resolve(__dirname, "./src/lib")
    }
  },
  test: {
    // V8 coverage — AST-aware remapping (Vitest 4 default)
    coverage: {
      provider: "v8",
      enabled: isCI,
      include: ["src/lib/design/**/*.{ts,svelte}"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/.cowlevel/**", "**/node_modules/**"],
      reporter: isCI ? ["text", "json", "html", "lcov"] : ["text"],
      reportsDirectory: "./coverage"
    },
    projects: [{
      extends: true,
      test: {
        include: ["src/lib/**/*.{test,spec}.{js,ts}"],
        setupFiles: ["vitest-browser-svelte"],
        browser: {
          enabled: true,
          provider: playwright(),
          instances: [{
            browser: "chromium"
          }],
          // headless defaults to process.env.CI — explicit for clarity
          headless: isCI,
          // Playwright traces for debugging CI failures
          trace: isCI ? "retain-on-failure" : "off",
          // Screenshot on test failure in CI
          screenshotFailures: isCI,
          api: {
            host: "127.0.0.1",
            port: 51205
          }
        }
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(__dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});