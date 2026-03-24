/**
 * @file components/accordion/Accordion.test.ts
 * @kind accordion
 * @layer components
 * @package @devpulse/coldlight
 *
 * Accordion compound component browser tests.
 * Tests sub-component exports.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";

// =============================================================================
// EXPORTS
// =============================================================================

describe("accordion component — exports", () => {
	test("exports Root component", async () => {
		const mod = await import("./index.js");
		expect(mod.Root).toBeDefined();
	});

	test("exports Item component", async () => {
		const mod = await import("./index.js");
		expect(mod.Item).toBeDefined();
	});

	test("exports Trigger component", async () => {
		const mod = await import("./index.js");
		expect(mod.Trigger).toBeDefined();
	});

	test("exports Content component", async () => {
		const mod = await import("./index.js");
		expect(mod.Content).toBeDefined();
	});

	test("exports Indicator component", async () => {
		const mod = await import("./index.js");
		expect(mod.Indicator).toBeDefined();
	});

	test("exports accordionComponentContract", async () => {
		const mod = await import("./index.js");
		expect(mod.accordionComponentContract).toBeDefined();
		expect(mod.accordionComponentContract.kind).toBe("accordion");
	});
});
