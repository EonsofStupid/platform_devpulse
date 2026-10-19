/**
 * @file components/collapsible/Collapsible.test.ts
 * @kind collapsible
 * @layer components
 * @package @devpulse/coldlight
 *
 * Collapsible disclosure pattern tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, expect, test } from "vitest";

describe("collapsible component — exports", () => {
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
});
