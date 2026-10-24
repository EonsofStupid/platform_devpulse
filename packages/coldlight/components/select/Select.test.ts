/**
 * @file components/select/Select.test.ts
 * @kind select
 * @layer components
 * @package @devpulse/coldlight
 *
 * Select compound component browser tests.
 * Tests sub-component exports.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";

// =============================================================================
// SUB-COMPONENT EXPORTS
// =============================================================================

describe("select component — exports", () => {
	test("exports Select root component", async () => {
		const mod = await import("./index.js");
		expect(mod.Select).toBeDefined();
	});

	test("exports SelectTrigger component", async () => {
		const mod = await import("./index.js");
		expect(mod.SelectTrigger).toBeDefined();
	});

	test("exports SelectContent component", async () => {
		const mod = await import("./index.js");
		expect(mod.SelectContent).toBeDefined();
	});

	test("exports SelectItem component", async () => {
		const mod = await import("./index.js");
		expect(mod.SelectItem).toBeDefined();
	});

	test("exports SelectLabel component", async () => {
		const mod = await import("./index.js");
		expect(mod.SelectLabel).toBeDefined();
	});

	test("exports SelectGroup component", async () => {
		const mod = await import("./index.js");
		expect(mod.SelectGroup).toBeDefined();
	});

	test("exports SelectTrigger", async () => {
		const mod = await import("./index.js");
		expect(mod.SelectTrigger).toBeDefined();
	});
});
