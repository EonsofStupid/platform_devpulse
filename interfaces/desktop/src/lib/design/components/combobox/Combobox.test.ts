/**
 * @file Combobox Gold Standard Tests
 * @kind combobox
 * @layer components
 * @package @devpulse/coldlight
 *
 * Comprehensive tests for the ColdLight Combobox compound component.
 * Verifies:
 * 1. Contract integrity — all slots, ARIA, keyboard, states declared
 * 2. ARIA 1.3 — new attributes declared in contract
 * 3. WAI-Adapt — machine-readable semantics for AI agents
 * 4. Live regions — dynamic content announcement config
 * 5. Sub-component exports — all 9 components + contract + recipe + types
 * 6. Recipe — per-slot class strings
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { expect, test, describe } from "vitest";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("combobox — contract integrity", () => {
	test("contract.kind is 'combobox'", () => {
		expect(contract.kind).toBe("combobox");
	});

	test("contract.primitiveKind is 'combobox'", () => {
		expect(contract.primitiveKind).toBe("combobox");
	});

	test("contract.apgPattern points to W3C combobox pattern", () => {
		expect(contract.apgPattern).toContain("w3.org/WAI/ARIA/apg/patterns/combobox");
	});

	test("contract has description for AI agents", () => {
		expect(contract.description.length).toBeGreaterThan(50);
		expect(contract.description).toContain("combobox");
	});

	test("required slots: root, input, trigger, content, option, group", () => {
		expect(contract.slots.required).toContain("root");
		expect(contract.slots.required).toContain("input");
		expect(contract.slots.required).toContain("trigger");
		expect(contract.slots.required).toContain("content");
		expect(contract.slots.required).toContain("option");
		expect(contract.slots.required).toContain("group");
	});

	test("optional slots: label, empty, announce", () => {
		expect(contract.slots.optional).toContain("label");
		expect(contract.slots.optional).toContain("empty");
		expect(contract.slots.optional).toContain("announce");
	});
});

// =============================================================================
// SLOT CONTRACTS — ARIA roles and attributes
// =============================================================================

describe("combobox — slot contracts", () => {
	test("input slot: role='combobox'", () => {
		expect(contract.slotContracts.input.aria.role).toBe("combobox");
	});

	test("input slot: requires aria-expanded + aria-controls", () => {
		const required = contract.slotContracts.input.aria.required.map((r) => r.attr);
		expect(required).toContain("aria-expanded");
		expect(required).toContain("aria-controls");
	});

	test("input slot: optional aria-activedescendant + aria-autocomplete", () => {
		const optional = contract.slotContracts.input.aria.optional.map((r) => r.attr);
		expect(optional).toContain("aria-activedescendant");
		expect(optional).toContain("aria-autocomplete");
	});

	test("input slot: ARIA 1.3 aria-description is optional", () => {
		const optional = contract.slotContracts.input.aria.optional.map((r) => r.attr);
		expect(optional).toContain("aria-description");
	});

	test("input slot: aria-controls relationship targets content", () => {
		const rel = contract.slotContracts.input.aria.relationships?.find(
			(r) => r.attr === "aria-controls",
		);
		expect(rel).toBeDefined();
		expect(rel?.targetSlot).toBe("content");
		expect(rel?.required).toBe(true);
	});

	test("trigger slot: role='button'", () => {
		expect(contract.slotContracts.trigger.aria.role).toBe("button");
	});

	test("content slot: role='listbox'", () => {
		expect(contract.slotContracts.content.aria.role).toBe("listbox");
	});

	test("option slot: role='option', requires aria-selected", () => {
		expect(contract.slotContracts.option.aria.role).toBe("option");
		const required = contract.slotContracts.option.aria.required.map((r) => r.attr);
		expect(required).toContain("aria-selected");
	});

	test("option slot: ARIA 1.3 aria-description + aria-details optional", () => {
		const optional = contract.slotContracts.option.aria.optional.map((r) => r.attr);
		expect(optional).toContain("aria-description");
		expect(optional).toContain("aria-details");
	});

	test("group slot: role='group', requires aria-labelledby", () => {
		expect(contract.slotContracts.group.aria.role).toBe("group");
		const required = contract.slotContracts.group.aria.required.map((r) => r.attr);
		expect(required).toContain("aria-labelledby");
	});

	test("empty slot: role='status' (live region)", () => {
		expect(contract.slotContracts.empty.aria.role).toBe("status");
	});

	test("announce slot: requires aria-live + aria-atomic", () => {
		const required = contract.slotContracts.announce.aria.required.map((r) => r.attr);
		expect(required).toContain("aria-live");
		expect(required).toContain("aria-atomic");
	});

	test("all slots have data-kind='combobox'", () => {
		const slotNames = Object.keys(contract.slotContracts) as Array<
			keyof typeof contract.slotContracts
		>;
		slotNames.forEach((slot) => {
			expect(contract.slotContracts[slot].data.kind).toBe("combobox");
		});
	});

	test("all slots have data-slot matching slot name", () => {
		const slotNames = Object.keys(contract.slotContracts) as Array<
			keyof typeof contract.slotContracts
		>;
		slotNames.forEach((slot) => {
			expect(contract.slotContracts[slot].data.slot).toBe(slot);
		});
	});
});

// =============================================================================
// KEYBOARD — APG combobox pattern
// =============================================================================

describe("combobox — keyboard contract (APG)", () => {
	const globalKeys = contract.keyboard.global.map((k) => k.key);

	test("ArrowDown: open-or-next", () => {
		expect(globalKeys).toContain("ArrowDown");
		const entry = contract.keyboard.global.find((k) => k.key === "ArrowDown");
		expect(entry?.action).toBe("open-or-next");
	});

	test("ArrowUp: open-or-prev", () => {
		expect(globalKeys).toContain("ArrowUp");
		const entry = contract.keyboard.global.find((k) => k.key === "ArrowUp");
		expect(entry?.action).toBe("open-or-prev");
	});

	test("Enter: select", () => {
		expect(globalKeys).toContain("Enter");
	});

	test("Escape: close", () => {
		expect(globalKeys).toContain("Escape");
	});

	test("Home: first", () => {
		expect(globalKeys).toContain("Home");
	});

	test("End: last", () => {
		expect(globalKeys).toContain("End");
	});

	test("Tab: accept-and-move", () => {
		expect(globalKeys).toContain("Tab");
		const entry = contract.keyboard.global.find((k) => k.key === "Tab");
		expect(entry?.action).toBe("accept-and-move");
	});

	test("input slot has per-slot keyboard entries", () => {
		const inputKb = contract.slotContracts.input.keyboard;
		expect(inputKb).toBeDefined();
		expect(inputKb!.length).toBeGreaterThanOrEqual(7);
	});
});

// =============================================================================
// FOCUS — activedescendant pattern
// =============================================================================

describe("combobox — focus management", () => {
	test("strategy is activedescendant", () => {
		expect(contract.focus.strategy).toBe("activedescendant");
	});

	test("initial focus goes to input", () => {
		expect(contract.focus.initialFocus).toBe("input");
	});

	test("focus returns to input on close", () => {
		expect(contract.focus.returnFocus).toBe("input");
	});
});

// =============================================================================
// STATES
// =============================================================================

describe("combobox — state semantics", () => {
	test("primary state is 'open'", () => {
		expect(contract.states.primary).toBe("open");
	});

	test("all states: open, closed, selected, highlighted, disabled", () => {
		expect(contract.states.all).toContain("open");
		expect(contract.states.all).toContain("closed");
		expect(contract.states.all).toContain("selected");
		expect(contract.states.all).toContain("highlighted");
		expect(contract.states.all).toContain("disabled");
	});

	test("ariaMapping: open → aria-expanded", () => {
		expect(contract.states.ariaMapping?.open).toBe("aria-expanded");
	});

	test("ariaMapping: selected → aria-selected", () => {
		expect(contract.states.ariaMapping?.selected).toBe("aria-selected");
	});
});

// =============================================================================
// INTERACTIONS
// =============================================================================

describe("combobox — interaction semantics", () => {
	test("modal: false", () => {
		expect(contract.interactions.modal).toBe(false);
	});

	test("selectable: true", () => {
		expect(contract.interactions.selectable).toBe(true);
	});

	test("editable: true (text input)", () => {
		expect(contract.interactions.editable).toBe(true);
	});

	test("expandable: true (popup)", () => {
		expect(contract.interactions.expandable).toBe(true);
	});
});

// =============================================================================
// ARIA 1.3 — New features
// =============================================================================

describe("combobox — ARIA 1.3", () => {
	test("targets ARIA 1.3", () => {
		expect(contract.ariaVersion).toBe("1.3");
	});

	test("uses aria-description attribute", () => {
		expect(contract.aria13?.attributes).toContain("aria-description");
	});

	test("uses aria-details attribute", () => {
		expect(contract.aria13?.attributes).toContain("aria-details");
	});
});

// =============================================================================
// WAI-ADAPT — Machine-readable semantics for AI/AT
// =============================================================================

describe("combobox — WAI-Adapt", () => {
	test("root action is 'filter'", () => {
		expect(contract.waiAdapt?.action).toBe("filter");
	});

	test("root purpose is 'search-term'", () => {
		expect(contract.waiAdapt?.purpose).toBe("search-term");
	});

	test("simplification is 'critical'", () => {
		expect(contract.waiAdapt?.simplification).toBe("critical");
	});

	test("slot-level adapt overrides exist", () => {
		expect(contract.waiAdapt?.slotAdapt?.input?.action).toBe("filter");
		expect(contract.waiAdapt?.slotAdapt?.input?.purpose).toBe("search-term");
		expect(contract.waiAdapt?.slotAdapt?.trigger?.action).toBe("open-listbox");
		expect(contract.waiAdapt?.slotAdapt?.option?.action).toBe("select");
	});
});

// =============================================================================
// LIVE REGIONS
// =============================================================================

describe("combobox — live regions", () => {
	test("has announce live region (polite, atomic)", () => {
		const announce = contract.liveRegions?.find((r) => r.slot === "announce");
		expect(announce).toBeDefined();
		expect(announce?.politeness).toBe("polite");
		expect(announce?.atomic).toBe(true);
		expect(announce?.relevant).toContain("text");
	});

	test("has empty live region (polite, atomic)", () => {
		const empty = contract.liveRegions?.find((r) => r.slot === "empty");
		expect(empty).toBeDefined();
		expect(empty?.politeness).toBe("polite");
		expect(empty?.atomic).toBe(true);
	});

	test("announce region describes result count", () => {
		const announce = contract.liveRegions?.find((r) => r.slot === "announce");
		expect(announce?.announces).toContain("results");
	});
});

// =============================================================================
// ACCESSIBLE NAME
// =============================================================================

describe("combobox — accessible name", () => {
	test("accessible name is required", () => {
		expect(contract.accessibleName.required).toBe(true);
	});

	test("sources include aria-label and aria-labelledby", () => {
		expect(contract.accessibleName.sources).toContain("aria-label");
		expect(contract.accessibleName.sources).toContain("aria-labelledby");
	});

	test("default label slot is 'label'", () => {
		expect(contract.accessibleName.defaultSlot).toBe("label");
	});
});

// =============================================================================
// SUB-COMPONENT EXPORTS
// =============================================================================

describe("combobox — exports", () => {
	test("exports all 9 sub-components", async () => {
		const mod = await import("./index.js");
		expect(mod.Combobox).toBeDefined();
		expect(mod.ComboboxInput).toBeDefined();
		expect(mod.ComboboxTrigger).toBeDefined();
		expect(mod.ComboboxContent).toBeDefined();
		expect(mod.ComboboxItem).toBeDefined();
		expect(mod.ComboboxGroup).toBeDefined();
		expect(mod.ComboboxEmpty).toBeDefined();
		expect(mod.ComboboxLabel).toBeDefined();
		expect(mod.ComboboxAnnounce).toBeDefined();
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

describe("combobox — recipe", () => {
	test("recipe returns all slot class strings", async () => {
		const { comboboxRecipe } = await import("./recipe.js");
		const recipe = comboboxRecipe();
		expect(typeof recipe.wrapper).toBe("string");
		expect(typeof recipe.input).toBe("string");
		expect(typeof recipe.trigger).toBe("string");
		expect(typeof recipe.content).toBe("string");
		expect(typeof recipe.item).toBe("string");
		expect(typeof recipe.group).toBe("string");
		expect(typeof recipe.groupLabel).toBe("string");
		expect(typeof recipe.empty).toBe("string");
		expect(typeof recipe.label).toBe("string");
	});

	test("recipe.input contains bg-transparent", async () => {
		const { comboboxRecipe } = await import("./recipe.js");
		expect(comboboxRecipe().input).toContain("bg-transparent");
	});

	test("recipe.content contains z-50 and border", async () => {
		const { comboboxRecipe } = await import("./recipe.js");
		const recipe = comboboxRecipe();
		expect(recipe.content).toContain("z-50");
		expect(recipe.content).toContain("border");
	});

	test("recipe.item contains cursor-pointer", async () => {
		const { comboboxRecipe } = await import("./recipe.js");
		expect(comboboxRecipe().item).toContain("cursor-pointer");
	});

	test("recipe.groupLabel contains uppercase tracking", async () => {
		const { comboboxRecipe } = await import("./recipe.js");
		expect(comboboxRecipe().groupLabel).toContain("uppercase");
		expect(comboboxRecipe().groupLabel).toContain("tracking-wider");
	});
});
