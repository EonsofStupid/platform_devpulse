/**
 * @file components/select/Select.test.ts
 * @kind select
 * @layer components
 * @package @devpulse/coldlight
 *
 * Select compound component browser tests.
 * Tests contract shape, sub-component exports, composition slots.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("select component — contract", () => {
	test("contract.kind is 'select'", () => {
		expect(contract.kind).toBe("select");
	});

	test("contract.primitiveKind is 'select'", () => {
		expect(contract.primitiveKind).toBe("select");
	});

	test("contract requires slots: root, trigger, content, item", () => {
		expect(contract.slots.required).toContain("root");
		expect(contract.slots.required).toContain("trigger");
		expect(contract.slots.required).toContain("content");
		expect(contract.slots.required).toContain("item");
	});

	test("contract optional slots: label, group", () => {
		expect(contract.slots.optional).toContain("label");
		expect(contract.slots.optional).toContain("group");
	});

	test("contract.interactions.selectable is true", () => {
		expect(contract.interactions.selectable).toBe(true);
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

describe("select component — slot contracts", () => {
	test("trigger slot has role='combobox'", () => {
		expect(contract.slotContracts.trigger.aria.role).toBe("combobox");
	});

	test("trigger slot requires aria-expanded", () => {
		const requiredAttrs = contract.slotContracts.trigger.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-expanded");
	});

	test("trigger slot requires aria-haspopup", () => {
		const requiredAttrs = contract.slotContracts.trigger.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-haspopup");
	});

	test("content slot has role='listbox'", () => {
		expect(contract.slotContracts.content.aria.role).toBe("listbox");
	});

	test("item slot has role='option'", () => {
		expect(contract.slotContracts.item.aria.role).toBe("option");
	});

	test("item slot requires aria-selected", () => {
		const requiredAttrs = contract.slotContracts.item.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-selected");
	});

	test("group slot has role='group'", () => {
		expect(contract.slotContracts.group.aria.role).toBe("group");
	});

	test("all slot data-kind values are 'select'", () => {
		const slotNames = Object.keys(contract.slotContracts) as Array<
			keyof typeof contract.slotContracts
		>;
		slotNames.forEach((slot) => {
			expect(contract.slotContracts[slot].data.kind).toBe("select");
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

describe("select component — keyboard contract", () => {
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

	test("exports selectComponentContract", async () => {
		const mod = await import("./index.js");
		expect(mod.selectComponentContract).toBeDefined();
		expect(mod.selectComponentContract.kind).toBe("select");
	});

	test("exports selectComposition", async () => {
		const mod = await import("./index.js");
		expect(mod.selectComposition).toBeDefined();
		expect(typeof mod.selectComposition).toBe("function");
	});
});

// =============================================================================
// RECIPE
// =============================================================================

describe("select component — composition", () => {
	test("composition returns all slot class strings", async () => {
		const { selectComposition } = await import("./composition.js");
		const composition = selectComposition();
		expect(typeof composition.trigger).toBe("string");
		expect(typeof composition.content).toBe("string");
		expect(typeof composition.item).toBe("string");
		expect(typeof composition.label).toBe("string");
		expect(typeof composition.group).toBe("string");
	});

	test("composition.trigger contains flex layout", async () => {
		const { selectComposition } = await import("./composition.js");
		const composition = selectComposition();
		expect(composition.trigger).toContain("flex");
		expect(composition.trigger).toContain("w-full");
	});

	test("composition.trigger contains border classes", async () => {
		const { selectComposition } = await import("./composition.js");
		const composition = selectComposition();
		expect(composition.trigger).toContain("border");
		expect(composition.trigger).toContain("rounded-lg");
	});

	test("composition.content contains z-index and border", async () => {
		const { selectComposition } = await import("./composition.js");
		const composition = selectComposition();
		expect(composition.content).toContain("z-50");
		expect(composition.content).toContain("border");
		expect(composition.content).toContain("rounded-lg");
	});

	test("composition.item contains cursor-pointer", async () => {
		const { selectComposition } = await import("./composition.js");
		const composition = selectComposition();
		expect(composition.item).toContain("cursor-pointer");
	});
});
