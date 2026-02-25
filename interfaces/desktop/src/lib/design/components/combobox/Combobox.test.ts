/**
 * @file components/combobox/Combobox.test.ts
 * @kind combobox
 * @layer components
 * @package @devpulse/coldlight
 *
 * Combobox compound component browser tests.
 * Tests contract shape, sub-component exports, recipe slots.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { expect, test, describe } from "vitest";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("combobox component — contract", () => {
	test("contract.kind is 'combobox'", () => {
		expect(contract.kind).toBe("combobox");
	});

	test("contract.primitiveKind is 'combobox'", () => {
		expect(contract.primitiveKind).toBe("combobox");
	});

	test("contract requires slots: root, input, trigger, content, option", () => {
		expect(contract.slots.required).toContain("root");
		expect(contract.slots.required).toContain("input");
		expect(contract.slots.required).toContain("trigger");
		expect(contract.slots.required).toContain("content");
		expect(contract.slots.required).toContain("option");
	});

	test("contract optional slots: label, empty", () => {
		expect(contract.slots.optional).toContain("label");
		expect(contract.slots.optional).toContain("empty");
	});

	test("contract.interactions.selectable is true", () => {
		expect(contract.interactions.selectable).toBe(true);
	});

	test("contract.interactions.editable is true", () => {
		expect(contract.interactions.editable).toBe(true);
	});

	test("contract.interactions.expandable is true", () => {
		expect(contract.interactions.expandable).toBe(true);
	});

	test("contract.interactions.modal is false", () => {
		expect(contract.interactions.modal).toBe(false);
	});

	test("contract.focus.strategy is 'activedescendant'", () => {
		expect(contract.focus.strategy).toBe("activedescendant");
	});
});

// =============================================================================
// CONTRACT SLOT CONTRACTS
// =============================================================================

describe("combobox component — slot contracts", () => {
	test("input slot has role='combobox'", () => {
		expect(contract.slotContracts.input.aria.role).toBe("combobox");
	});

	test("input slot requires aria-expanded", () => {
		const requiredAttrs = contract.slotContracts.input.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-expanded");
	});

	test("input slot requires aria-controls", () => {
		const requiredAttrs = contract.slotContracts.input.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-controls");
	});

	test("trigger slot has role='button'", () => {
		expect(contract.slotContracts.trigger.aria.role).toBe("button");
	});

	test("content slot has role='listbox'", () => {
		expect(contract.slotContracts.content.aria.role).toBe("listbox");
	});

	test("option slot has role='option'", () => {
		expect(contract.slotContracts.option.aria.role).toBe("option");
	});

	test("option slot requires aria-selected", () => {
		const requiredAttrs = contract.slotContracts.option.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-selected");
	});

	test("all slot data-kind values are 'combobox'", () => {
		const slotNames = Object.keys(contract.slotContracts) as Array<keyof typeof contract.slotContracts>;
		slotNames.forEach((slot) => {
			expect(contract.slotContracts[slot].data.kind).toBe("combobox");
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

describe("combobox component — keyboard contract", () => {
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

	test("global keyboard includes Escape", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("Escape");
	});

	test("global keyboard includes Tab", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("Tab");
	});
});

// =============================================================================
// SUB-COMPONENT EXPORTS
// =============================================================================

describe("combobox component — exports", () => {
	test("exports Combobox root component", async () => {
		const mod = await import("./index.js");
		expect(mod.Combobox).toBeDefined();
	});

	test("exports ComboboxInput component", async () => {
		const mod = await import("./index.js");
		expect(mod.ComboboxInput).toBeDefined();
	});

	test("exports ComboboxTrigger component", async () => {
		const mod = await import("./index.js");
		expect(mod.ComboboxTrigger).toBeDefined();
	});

	test("exports ComboboxContent component", async () => {
		const mod = await import("./index.js");
		expect(mod.ComboboxContent).toBeDefined();
	});

	test("exports ComboboxItem component", async () => {
		const mod = await import("./index.js");
		expect(mod.ComboboxItem).toBeDefined();
	});

	test("exports ComboboxEmpty component", async () => {
		const mod = await import("./index.js");
		expect(mod.ComboboxEmpty).toBeDefined();
	});

	test("exports ComboboxLabel component", async () => {
		const mod = await import("./index.js");
		expect(mod.ComboboxLabel).toBeDefined();
	});

	test("exports comboboxComponentContract", async () => {
		const mod = await import("./index.js");
		expect(mod.comboboxComponentContract).toBeDefined();
		expect(mod.comboboxComponentContract.kind).toBe("combobox");
	});

	test("exports comboboxRecipe", async () => {
		const mod = await import("./index.js");
		expect(mod.comboboxRecipe).toBeDefined();
		expect(typeof mod.comboboxRecipe).toBe("function");
	});
});

// =============================================================================
// RECIPE
// =============================================================================

describe("combobox component — recipe", () => {
	test("recipe returns all slot class strings", async () => {
		const { comboboxRecipe } = await import("./recipe.js");
		const recipe = comboboxRecipe();
		expect(typeof recipe.wrapper).toBe("string");
		expect(typeof recipe.input).toBe("string");
		expect(typeof recipe.trigger).toBe("string");
		expect(typeof recipe.content).toBe("string");
		expect(typeof recipe.item).toBe("string");
		expect(typeof recipe.empty).toBe("string");
		expect(typeof recipe.label).toBe("string");
	});

	test("recipe.input contains bg-transparent", async () => {
		const { comboboxRecipe } = await import("./recipe.js");
		const recipe = comboboxRecipe();
		expect(recipe.input).toContain("bg-transparent");
	});

	test("recipe.content contains z-index and border", async () => {
		const { comboboxRecipe } = await import("./recipe.js");
		const recipe = comboboxRecipe();
		expect(recipe.content).toContain("z-50");
		expect(recipe.content).toContain("border");
		expect(recipe.content).toContain("rounded-lg");
	});

	test("recipe.item contains cursor-pointer", async () => {
		const { comboboxRecipe } = await import("./recipe.js");
		const recipe = comboboxRecipe();
		expect(recipe.item).toContain("cursor-pointer");
	});

	test("recipe.wrapper contains border and rounded", async () => {
		const { comboboxRecipe } = await import("./recipe.js");
		const recipe = comboboxRecipe();
		expect(recipe.wrapper).toContain("border");
		expect(recipe.wrapper).toContain("rounded-lg");
	});

	test("recipe.empty contains text-center", async () => {
		const { comboboxRecipe } = await import("./recipe.js");
		const recipe = comboboxRecipe();
		expect(recipe.empty).toContain("text-center");
	});
});
