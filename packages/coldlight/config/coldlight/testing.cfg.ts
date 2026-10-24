/**
 * @file ColdLight Testing Configuration
 * @package @devpulse/coldlight
 *
 * Declares testing requirements for all ColdLight entities.
 * Scanner uses this config to flag missing test files.
 * CI pipeline enforces zero test failures.
 *
 * Every primitive and component MUST have tests.
 * Tests run in real Chromium via vitest-browser-svelte + @vitest/browser-playwright.
 * No jsdom. No mocking DOM.
 */

export const TESTING = {
	vitest: {
		enabled: true,
		/** Test file naming: {Name}.test.ts in each primitive/component folder */
		filePattern: "*.test.ts",
		/** Real browser — not jsdom */
		browser: "chromium",
	},
	playwright: {
		enabled: true,
	},
	/** Scanner flags primitives/components missing test files */
	scannerEnforced: true,
} as const;
