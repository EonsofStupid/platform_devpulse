/**
 * @file vitest.config.ts
 * @package @devpulse/coldlight
 *
 * ColdLight's component tests — Vitest 5 browser mode (Chromium via Playwright).
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
		// Tests are `*.test.ts`. `primitives/<kind>/<kind>.spec.ts` are the primitives' a11y
		// specs (`definePrimitive`), not test suites.
		include: ["**/*.test.{js,ts}"],
		exclude: ["**/node_modules/**", ".cowlevel/**"],
		setupFiles: ["vitest-browser-svelte"],
		// No pinned port: Vitest takes the next free one. A pinned start inside a range the
		// OS refuses (51205–54179 on the dev machine) scanned ~3000 ports before starting.
		api: {
			host: "127.0.0.1",
		},
		// V8 coverage — AST-aware remapping
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
			// Migrating these tests to Vitest 5's exact text matching takes a suite run.
			locators: { exact: false },
		},
	},
});
