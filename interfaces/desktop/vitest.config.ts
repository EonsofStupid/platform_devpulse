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

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isCI = !!process.env.CI;

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
			// headless defaults to process.env.CI — explicit for clarity
			headless: isCI,
			// Playwright traces for debugging CI failures
			trace: isCI ? "retain-on-failure" : "off",
			// Screenshot on test failure in CI
			screenshotFailures: isCI,
			api: {
				host: "127.0.0.1",
				port: 51205,
			},
		},

		// V8 coverage — AST-aware remapping (Vitest 4 default)
		coverage: {
			provider: "v8",
			enabled: isCI,
			include: ["src/lib/design/**/*.{ts,svelte}"],
			exclude: [
				"**/*.test.ts",
				"**/*.spec.ts",
				"**/.cowlevel/**",
				"**/node_modules/**",
			],
			reporter: isCI ? ["text", "json", "html", "lcov"] : ["text"],
			reportsDirectory: "./coverage",
		},
	},
});
