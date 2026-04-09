import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config for DevPulse desktop.
 *
 * REQUIRES: `cargo xtask run-dev` running on port 1420.
 * This connects to the LIVE Tauri app — real backend, real models, real UI.
 *
 * Run:  pnpm test:e2e        (headless)
 * Run:  pnpm test:e2e:ui     (headed — watch in browser)
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false, // wizard tests are sequential
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1, // one worker — talks to one app instance
	reporter: process.env.CI ? "html" : "list",
	timeout: 60_000, // model downloads can take time
	use: {
		baseURL: "http://localhost:1420",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	// No webServer — app must already be running via `cargo xtask run-dev`
});
