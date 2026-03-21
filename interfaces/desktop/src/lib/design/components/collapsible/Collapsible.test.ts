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
import { contract } from "./contract.js";

describe("collapsible component — contract", () => {
	test("contract.kind is 'collapsible'", () => {
		expect(contract.kind).toBe("collapsible");
	});

	test("contract requires trigger and content slots", () => {
		expect(contract.slots.required).toContain("trigger");
		expect(contract.slots.required).toContain("content");
	});

	test("trigger requires aria-expanded", () => {
		const attrs = contract.slotContracts.trigger.aria.required.map((r) => r.attr);
		expect(attrs).toContain("aria-expanded");
	});

	test("trigger requires aria-controls", () => {
		const attrs = contract.slotContracts.trigger.aria.required.map((r) => r.attr);
		expect(attrs).toContain("aria-controls");
	});

	test("content has role region", () => {
		expect(contract.slotContracts.content.aria.role).toBe("region");
	});

	test("interactions.expandable is true", () => {
		expect(contract.interactions.expandable).toBe(true);
	});
});

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
