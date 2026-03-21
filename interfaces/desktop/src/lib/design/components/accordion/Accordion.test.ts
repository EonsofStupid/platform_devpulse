/**
 * @file components/accordion/Accordion.test.ts
 * @kind accordion
 * @layer components
 * @package @devpulse/coldlight
 *
 * Accordion compound component browser tests.
 * Tests contract shape, sub-component exports, keyboard contract.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("accordion component — contract", () => {
	test("contract.kind is 'accordion'", () => {
		expect(contract.kind).toBe("accordion");
	});

	test("contract.primitiveKind is 'accordion'", () => {
		expect(contract.primitiveKind).toBe("accordion");
	});

	test("contract requires slots: root, item, trigger, content", () => {
		expect(contract.slots.required).toContain("root");
		expect(contract.slots.required).toContain("item");
		expect(contract.slots.required).toContain("trigger");
		expect(contract.slots.required).toContain("content");
	});

	test("contract has optional indicator slot", () => {
		expect(contract.slots.optional).toContain("indicator");
	});

	test("contract.interactions.expandable is true", () => {
		expect(contract.interactions.expandable).toBe(true);
	});

	test("contract.focus.strategy is 'roving'", () => {
		expect(contract.focus.strategy).toBe("roving");
	});
});

// =============================================================================
// SLOT CONTRACTS
// =============================================================================

describe("accordion component — slot contracts", () => {
	test("trigger slot requires aria-expanded", () => {
		const requiredAttrs = contract.slotContracts.trigger.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-expanded");
	});

	test("trigger slot requires aria-controls", () => {
		const requiredAttrs = contract.slotContracts.trigger.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-controls");
	});

	test("content slot has role='region'", () => {
		expect(contract.slotContracts.content.aria.role).toBe("region");
	});

	test("content slot requires aria-labelledby", () => {
		const requiredAttrs = contract.slotContracts.content.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-labelledby");
	});

	test("all slot data-kind values are 'accordion'", () => {
		const slotNames = Object.keys(contract.slotContracts) as Array<
			keyof typeof contract.slotContracts
		>;
		slotNames.forEach((slot) => {
			expect(contract.slotContracts[slot].data.kind).toBe("accordion");
		});
	});
});

// =============================================================================
// KEYBOARD CONTRACT
// =============================================================================

describe("accordion component — keyboard contract", () => {
	test("global keyboard includes ArrowDown", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("ArrowDown");
	});

	test("global keyboard includes ArrowUp", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("ArrowUp");
	});

	test("global keyboard includes Home and End", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("Home");
		expect(keys).toContain("End");
	});

	test("global keyboard includes Enter and Space", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("Enter");
		expect(keys).toContain("Space");
	});
});

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
