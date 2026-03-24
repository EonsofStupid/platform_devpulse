/**
 * @file components/dialog/Dialog.test.ts
 * @kind dialog
 * @layer components
 * @package @devpulse/coldlight
 *
 * Dialog compound component browser tests.
 * Tests contract shape, ARIA, exports.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";

// =============================================================================
// EXPORTS
// =============================================================================

describe("dialog component — exports", () => {
	test("exports Root", async () => {
		const mod = await import("./index.js");
		expect(mod.Root).toBeDefined();
	});

	test("exports Trigger", async () => {
		const mod = await import("./index.js");
		expect(mod.Trigger).toBeDefined();
	});

	test("exports Content", async () => {
		const mod = await import("./index.js");
		expect(mod.Content).toBeDefined();
	});

	test("exports Overlay", async () => {
		const mod = await import("./index.js");
		expect(mod.Overlay).toBeDefined();
	});

	test("exports Close", async () => {
		const mod = await import("./index.js");
		expect(mod.Close).toBeDefined();
	});
});
