/**
 * @file components/tooltip/Tooltip.test.ts
 * @kind tooltip
 * @layer components
 * @package @devpulse/coldlight
 *
 * Tooltip compound component browser tests.
 * Tests contract shape, sub-component exports, data-kind/data-slot attributes.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("tooltip component — contract", () => {
	test("contract.kind is 'tooltip'", () => {
		expect(contract.kind).toBe("tooltip");
	});

	test("contract.primitiveKind is 'tooltip'", () => {
		expect(contract.primitiveKind).toBe("tooltip");
	});

	test("contract requires slots: trigger, content", () => {
		expect(contract.slots.required).toContain("trigger");
		expect(contract.slots.required).toContain("content");
	});

	test("contract has optional slot: arrow", () => {
		expect(contract.slots.optional).toContain("arrow");
	});

	test("contract.interactions.modal is false", () => {
		expect(contract.interactions.modal).toBe(false);
	});

	test("contract.interactions.expandable is false", () => {
		expect(contract.interactions.expandable).toBe(false);
	});

	test("contract.focus.strategy is 'none'", () => {
		expect(contract.focus.strategy).toBe("none");
	});
});

// =============================================================================
// CONTRACT SLOT CONTRACTS
// =============================================================================

describe("tooltip component — slot contracts", () => {
	test("content slot has role='tooltip'", () => {
		expect(contract.slotContracts.content.aria.role).toBe("tooltip");
	});

	test("trigger slot element is 'span'", () => {
		expect(contract.slotContracts.trigger.element).toBe("span");
	});

	test("content slot element is 'div'", () => {
		expect(contract.slotContracts.content.element).toBe("div");
	});

	test("all slot data-kind values are 'tooltip'", () => {
		const slotNames = Object.keys(contract.slotContracts) as Array<
			keyof typeof contract.slotContracts
		>;
		slotNames.forEach((slot) => {
			expect(contract.slotContracts[slot].data.kind).toBe("tooltip");
		});
	});

	test("slot data-slot matches slot name", () => {
		const slotNames = Object.keys(contract.slotContracts) as Array<
			keyof typeof contract.slotContracts
		>;
		slotNames.forEach((slot) => {
			expect(contract.slotContracts[slot].data.slot).toBe(slot);
		});
	});

	test("content slot has open/closed states", () => {
		expect(contract.slotContracts.content.data.states).toContain("open");
		expect(contract.slotContracts.content.data.states).toContain("closed");
	});
});

// =============================================================================
// KEYBOARD CONTRACT
// =============================================================================

describe("tooltip component — keyboard contract", () => {
	test("global keyboard includes Escape", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("Escape");
	});
});

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

	test("exports tooltipComponentContract", async () => {
		const mod = await import("./index.js");
		expect(mod.tooltipComponentContract).toBeDefined();
		expect(mod.tooltipComponentContract.kind).toBe("tooltip");
	});

	test("exports tooltipComposition", async () => {
		const mod = await import("./index.js");
		expect(mod.tooltipComposition).toBeDefined();
		expect(typeof mod.tooltipComposition).toBe("function");
	});
});

// =============================================================================
// RECIPE
// =============================================================================

describe("tooltip component — composition", () => {
	test("composition returns content and arrow class strings", async () => {
		const { tooltipComposition } = await import("./composition.js");
		const composition = tooltipComposition();
		expect(typeof composition.content).toBe("string");
		expect(typeof composition.arrow).toBe("string");
	});

	test("composition.content contains z-50 for proper layering", async () => {
		const { tooltipComposition } = await import("./composition.js");
		const composition = tooltipComposition();
		expect(composition.content).toContain("z-50");
	});

	test("composition.content contains bg-neutral-900", async () => {
		const { tooltipComposition } = await import("./composition.js");
		const composition = tooltipComposition();
		expect(composition.content).toContain("bg-neutral-900");
	});

	test("composition.content contains shadow-lg", async () => {
		const { tooltipComposition } = await import("./composition.js");
		const composition = tooltipComposition();
		expect(composition.content).toContain("shadow-lg");
	});
});
