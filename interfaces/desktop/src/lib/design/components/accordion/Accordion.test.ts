/**
 * @file components/accordion/Accordion.test.ts
 * @kind accordion
 * @layer components
 * @package @devpulse/coldlight
 *
 * Accordion compound component browser tests.
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

	test("contract.interactions.expandable is true", () => {
		expect(contract.interactions.expandable).toBe(true);
	});

	test("contract.interactions.modal is false", () => {
		expect(contract.interactions.modal).toBe(false);
	});

	test("contract.focus.strategy is 'roving'", () => {
		expect(contract.focus.strategy).toBe("roving");
	});
});

// =============================================================================
// CONTRACT SLOT CONTRACTS
// =============================================================================

describe("accordion component — slot contracts", () => {
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

	test("slot data-slot matches slot name", () => {
		const slotNames = Object.keys(contract.slotContracts) as Array<
			keyof typeof contract.slotContracts
		>;
		slotNames.forEach((slot) => {
			expect(contract.slotContracts[slot].data.slot).toBe(slot);
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

	test("global keyboard includes Home", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("Home");
	});

	test("global keyboard includes End", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("End");
	});

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

describe("accordion component — exports", () => {
	test("exports Accordion root component", async () => {
		const mod = await import("./index.js");
		expect(mod.Accordion).toBeDefined();
	});

	test("exports AccordionItem component", async () => {
		const mod = await import("./index.js");
		expect(mod.AccordionItem).toBeDefined();
	});

	test("exports AccordionTrigger component", async () => {
		const mod = await import("./index.js");
		expect(mod.AccordionTrigger).toBeDefined();
	});

	test("exports AccordionContent component", async () => {
		const mod = await import("./index.js");
		expect(mod.AccordionContent).toBeDefined();
	});

	test("exports accordionComponentContract", async () => {
		const mod = await import("./index.js");
		expect(mod.accordionComponentContract).toBeDefined();
		expect(mod.accordionComponentContract.kind).toBe("accordion");
	});

	test("exports accordionRecipe", async () => {
		const mod = await import("./index.js");
		expect(mod.accordionRecipe).toBeDefined();
		expect(typeof mod.accordionRecipe).toBe("function");
	});
});

// =============================================================================
// RECIPE
// =============================================================================

describe("accordion component — recipe", () => {
	test("recipe returns root, trigger, content class strings", async () => {
		const { accordionRecipe } = await import("./recipe.js");
		const recipe = accordionRecipe();
		expect(typeof recipe.root).toBe("string");
		expect(typeof recipe.trigger).toBe("string");
		expect(typeof recipe.content).toBe("string");
	});

	test("recipe.root contains border classes", async () => {
		const { accordionRecipe } = await import("./recipe.js");
		const recipe = accordionRecipe();
		expect(recipe.root).toContain("border");
		expect(recipe.root).toContain("rounded-lg");
	});

	test("recipe.trigger contains flex layout", async () => {
		const { accordionRecipe } = await import("./recipe.js");
		const recipe = accordionRecipe();
		expect(recipe.trigger).toContain("flex");
		expect(recipe.trigger).toContain("w-full");
	});
});
