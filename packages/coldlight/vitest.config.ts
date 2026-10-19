/**
 * @file vitest.config.ts
 * @package @devpulse/coldlight
 *
 * ColdLight's component tests — Vitest 4 browser mode (Chromium via Playwright).
 *
 * Dev:  headed browser, no coverage, no traces
 * CI:   headless, coverage v8, traces on failure, screenshot on failure
 */

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const isCI = !!process.env.CI;

export default defineConfig({
	plugins: [svelte()],
	test: {
		include: ["**/*.{test,spec}.{js,ts}"],
		exclude: ["**/node_modules/**", ".cowlevel/**"],
		setupFiles: ["vitest-browser-svelte"],
		// V8 coverage — AST-aware remapping (Vitest 4 default)
		coverage: {
			provider: "v8",
			enabled: isCI,
			include: ["**/*.{ts,svelte}"],
			exclude: ["**/*.test.ts", "**/*.spec.ts", "**/.cowlevel/**", "**/node_modules/**"],
			reporter: isCI ? ["text", "json", "html", "lcov"] : ["text"],
			reportsDirectory: "./coverage",
		},
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
	},
});
