/**
 * @file Combobox component tests
 * @kind combobox
 * @layer components
 *
 * Tests exports and ARIA.
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, expect, test } from "vitest";

describe("combobox component — exports", () => {
	test("exports Root", async () => {
		const mod = await import("./index.js");
		expect(mod.Root).toBeDefined();
	});

	test("exports Input", async () => {
		const mod = await import("./index.js");
		expect(mod.Input).toBeDefined();
	});

	test("exports Trigger", async () => {
		const mod = await import("./index.js");
		expect(mod.Trigger).toBeDefined();
	});

	test("exports Content", async () => {
		const mod = await import("./index.js");
		expect(mod.Content).toBeDefined();
	});

	test("exports Item", async () => {
		const mod = await import("./index.js");
		expect(mod.Item).toBeDefined();
	});

	test("exports Group", async () => {
		const mod = await import("./index.js");
		expect(mod.Group).toBeDefined();
	});

	test("exports Announce", async () => {
		const mod = await import("./index.js");
		expect(mod.Announce).toBeDefined();
	});
});
