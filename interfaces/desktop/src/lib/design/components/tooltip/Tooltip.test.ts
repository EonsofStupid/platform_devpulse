/**
 * @file components/tooltip/Tooltip.test.ts
 * @kind tooltip
 * @layer components
 * @package @devpulse/coldlight
 *
 * Tooltip compound component browser tests.
 * Tests sub-component exports.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";

// =============================================================================
// SUB-COMPONENT EXPORTS
// =============================================================================

describe("tooltip component — exports", () => {
	test("exports Tooltip root component", async () => {
		const mod = await import("./index.js");
		expect(mod.Tooltip).toBeDefined();
	});

	test("exports TooltipTrigger component", async () => {
		const mod = await import("./index.js");
		expect(mod.TooltipTrigger).toBeDefined();
	});

	test("exports TooltipContent component", async () => {
		const mod = await import("./index.js");
		expect(mod.TooltipContent).toBeDefined();
	});

	test("exports TooltipTrigger", async () => {
		const mod = await import("./index.js");
		expect(mod.TooltipTrigger).toBeDefined();
	});
});
