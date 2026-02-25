/**
 * @file components/collapsible/Collapsible.test.ts
 * @kind collapsible
 * @layer components
 * @package @devpulse/coldlight
 *
 * Collapsible compound component browser tests.
 * Tests contract shape, sub-component exports, data-kind/data-slot attributes.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { expect, test, describe } from "vitest";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("collapsible component — contract", () => {
	test("contract.kind is 'collapsible'", () => {
		expect(contract.kind).toBe("collapsible");
	});

	test("contract.primitiveKind is 'collapsible'", () => {
		expect(contract.primitiveKind).toBe("collapsible");
	});

	test("contract requires slots: root, trigger, content", () => {
		expect(contract.slots.required).toContain("root");
		expect(contract.slots.required).toContain("trigger");
		expect(contract.slots.required).toContain("content");
	});

	test("contract.interactions.expandable is true", () => {
		expect(contract.interactions.expandable).toBe(true);
	});

	test("contract.interactions.modal is false", () => {
		expect(contract.interactions.modal).toBe(false);
	});

	test("contract.focus.strategy is 'none'", () => {
		expect(contract.focus.strategy).toBe("none");
	});
});

// =============================================================================
// CONTRACT SLOT CONTRACTS
// =============================================================================

describe("collapsible component — slot contracts", () => {
	test("trigger slot has role='button'", () => {
		expect(contract.slotContracts.trigger.aria.role).toBe("button");
	});

	test("trigger slot requires aria-expanded", () => {
		const requiredAttrs = contract.slotContracts.trigger.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-expanded");
	});

	test("trigger slot requires aria-controls", () => {
		const requiredAttrs = contract.slotContracts.trigger.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-controls");
	});

	test("root slot has open/closed states", () => {
		expect(contract.slotContracts.root.data.states).toContain("open");
		expect(contract.slotContracts.root.data.states).toContain("closed");
	});

	test("content slot has open/closed states", () => {
		expect(contract.slotContracts.content.data.states).toContain("open");
		expect(contract.slotContracts.content.data.states).toContain("closed");
	});

	test("all slot data-kind values are 'collapsible'", () => {
		const slotNames = Object.keys(contract.slotContracts) as Array<keyof typeof contract.slotContracts>;
		slotNames.forEach((slot) => {
			expect(contract.slotContracts[slot].data.kind).toBe("collapsible");
		});
	});

	test("slot data-slot matches slot name", () => {
		const slotNames = Object.keys(contract.slotContracts) as Array<keyof typeof contract.slotContracts>;
		slotNames.forEach((slot) => {
			expect(contract.slotContracts[slot].data.slot).toBe(slot);
		});
	});
});

// =============================================================================
// KEYBOARD CONTRACT
// =============================================================================

describe("collapsible component — keyboard contract", () => {
	test("global keyboard includes Enter", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("Enter");
	});

	test("global keyboard includes Space", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("Space");
	});
});

// =============================================================================
// SUB-COMPONENT EXPORTS
// =============================================================================

describe("collapsible component — exports", () => {
	test("exports Collapsible root component", async () => {
		const mod = await import("./index.js");
		expect(mod.Collapsible).toBeDefined();
	});

	test("exports CollapsibleTrigger component", async () => {
		const mod = await import("./index.js");
		expect(mod.CollapsibleTrigger).toBeDefined();
	});

	test("exports CollapsibleContent component", async () => {
		const mod = await import("./index.js");
		expect(mod.CollapsibleContent).toBeDefined();
	});

	test("exports collapsibleComponentContract", async () => {
		const mod = await import("./index.js");
		expect(mod.collapsibleComponentContract).toBeDefined();
		expect(mod.collapsibleComponentContract.kind).toBe("collapsible");
	});

	test("exports collapsibleRecipe", async () => {
		const mod = await import("./index.js");
		expect(mod.collapsibleRecipe).toBeDefined();
		expect(typeof mod.collapsibleRecipe).toBe("function");
	});
});

// =============================================================================
// RECIPE
// =============================================================================

describe("collapsible component — recipe", () => {
	test("recipe returns trigger and content class strings", async () => {
		const { collapsibleRecipe } = await import("./recipe.js");
		const recipe = collapsibleRecipe();
		expect(typeof recipe.trigger).toBe("string");
		expect(typeof recipe.content).toBe("string");
	});

	test("recipe.trigger contains flex layout", async () => {
		const { collapsibleRecipe } = await import("./recipe.js");
		const recipe = collapsibleRecipe();
		expect(recipe.trigger).toContain("flex");
		expect(recipe.trigger).toContain("w-full");
	});

	test("recipe.content contains overflow-hidden", async () => {
		const { collapsibleRecipe } = await import("./recipe.js");
		const recipe = collapsibleRecipe();
		expect(recipe.content).toContain("overflow-hidden");
	});
});
