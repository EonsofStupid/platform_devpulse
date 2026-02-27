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
 * 5. Sub-component exports — all 9 components + contract + recipe + a11y + types
 * 6. Recipe — variant-driven per-slot class strings (size, disabled, OKLCH tokens)
 * 7. A11y module — focus config, live regions, keyboard map, announcements, audit
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { expect, test, describe } from "vitest";
import { contract } from "./contract.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import "$lib/design/recipes/components/combobox/combobox.default.js";
import type { DsSurfaceProps } from "$lib/design/recipes/types.js";

/** Resolve recipe classes for a given size (defaults filled from registry). */
function resolveRecipe(size: "sm" | "md" | "lg" = "md"): Record<string, string> {
	const def = getRecipe("combobox.glass.void")!;
	return def.classes({ ...def.defaults, size } as DsSurfaceProps);
}

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

	test("exports comboboxRecipes legend + IDs", async () => {
		const mod = await import("./index.js");
		expect(mod.comboboxRecipes).toBeDefined();
		expect(mod.comboboxRecipes.kind).toBe("combobox");
		expect(mod.comboboxRecipes.defaultId).toBe("combobox.glass.void");
		expect(mod.comboboxRecipeIds).toBeDefined();
		expect(mod.comboboxRecipeIds).toContain("combobox.glass.void");
	});

	test("exports a11y utilities", async () => {
		const mod = await import("./index.js");
		expect(mod.comboboxFocusConfig).toBeDefined();
		expect(mod.comboboxLiveRegions).toBeDefined();
		expect(mod.comboboxKeyboardMap).toBeDefined();
		expect(mod.comboboxAnnouncements).toBeDefined();
		expect(mod.comboboxAdaptAttrs).toBeDefined();
		expect(typeof mod.comboboxSlotAdapt).toBe("function");
		expect(mod.comboboxRelationships).toBeDefined();
		expect(typeof mod.auditCombobox).toBe("function");
	});
});

// =============================================================================
// RECIPE REGISTRY — ID-based, OKLCH tokens, molecule utilities
// =============================================================================

describe("combobox — recipe registry (SSOT)", () => {
	test("recipe is registered with ID 'combobox.glass.void'", () => {
		const def = getRecipe("combobox.glass.void");
		expect(def).toBeDefined();
		expect(def!.kind).toBe("combobox");
		expect(def!.label).toBe("Glass Void Combobox");
	});

	test("recipe defaults include all DsSurfaceProps", () => {
		const def = getRecipe("combobox.glass.void")!;
		expect(def.defaults.surface).toBe("glass");
		expect(def.defaults.variant).toBe("void");
		expect(def.defaults.accent).toBe("teal");
		expect(def.defaults.radius).toBe("lg");
		expect(def.defaults.depth).toBe(2);
		expect(def.defaults.glow).toBe("teal");
		expect(def.defaults.bevel).toBe("soft");
		expect(def.defaults.size).toBe("md");
	});

	test("recipe returns all slot class strings", () => {
		const recipe = resolveRecipe();
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

	test("default size is md", () => {
		const recipe = resolveRecipe();
		expect(recipe.wrapper).toContain("min-h-10");
	});

	test("size sm: smaller height + padding", () => {
		const recipe = resolveRecipe("sm");
		expect(recipe.wrapper).toContain("min-h-8");
		expect(recipe.input).toContain("px-2");
	});

	test("size lg: larger height + padding", () => {
		const recipe = resolveRecipe("lg");
		expect(recipe.wrapper).toContain("min-h-12");
		expect(recipe.input).toContain("px-4");
		expect(recipe.input).toContain("text-base");
	});

	test("uses OKLCH component tokens, not raw white/opacity", () => {
		const recipe = resolveRecipe();
		expect(recipe.wrapper).toContain("--combobox-bg");
		expect(recipe.wrapper).toContain("--combobox-border");
		expect(recipe.wrapper).not.toContain("white/");
		expect(recipe.input).not.toContain("white/");
		expect(recipe.item).not.toContain("white/");
		expect(recipe.trigger).not.toContain("white/");
	});

	test("uses semantic text tokens", () => {
		const recipe = resolveRecipe();
		expect(recipe.input).toContain("text-text-primary");
		expect(recipe.input).toContain("text-text-muted");
		expect(recipe.trigger).toContain("text-text-secondary");
	});

	test("content uses molecule utilities (surface + depth + glow)", () => {
		const recipe = resolveRecipe();
		expect(recipe.content).toContain("glass-void");
		expect(recipe.content).toContain("depth-raised");
		expect(recipe.content).toContain("glow-teal");
	});

	test("wrapper uses bevel molecule utility", () => {
		const recipe = resolveRecipe();
		expect(recipe.wrapper).toContain("bevel-soft");
	});

	test("recipe.input contains bg-transparent", () => {
		expect(resolveRecipe().input).toContain("bg-transparent");
	});

	test("recipe.content contains z-50 and border", () => {
		const recipe = resolveRecipe();
		expect(recipe.content).toContain("z-50");
		expect(recipe.content).toContain("border");
	});

	test("recipe.item contains cursor-pointer", () => {
		expect(resolveRecipe().item).toContain("cursor-pointer");
	});

	test("recipe.groupLabel contains uppercase tracking", () => {
		expect(resolveRecipe().groupLabel).toContain("uppercase");
		expect(resolveRecipe().groupLabel).toContain("tracking-wider");
	});

	test("item uses Tier 3 tokens for highlight and selected", () => {
		const recipe = resolveRecipe();
		expect(recipe.item).toContain("--combobox-option-hover");
		expect(recipe.item).toContain("--combobox-option-selected-bg");
		expect(recipe.item).toContain("--combobox-option-selected-text");
	});

	test("focus ring uses --combobox-border-focus", () => {
		const recipe = resolveRecipe();
		expect(recipe.wrapper).toContain("--combobox-border-focus");
		expect(recipe.trigger).toContain("--combobox-border-focus");
	});

	test("radius uses utility class from props", () => {
		const recipe = resolveRecipe();
		expect(recipe.wrapper).toContain("rounded-lg");
		expect(recipe.content).toContain("rounded-lg");
	});
});

// =============================================================================
// A11Y MODULE — Focus, live regions, keyboard, announcements, audit
// =============================================================================

describe("combobox — a11y module", () => {
	test("focus config: activedescendant strategy", async () => {
		const { comboboxFocusConfig } = await import("./a11y.js");
		expect(comboboxFocusConfig.strategy).toBe("activedescendant");
		expect(comboboxFocusConfig.initialFocus).toBe("input");
		expect(comboboxFocusConfig.returnFocus).toBe("input");
		expect(comboboxFocusConfig.wrap).toBe(true);
		expect(comboboxFocusConfig.orientation).toBe("vertical");
	});

	test("live regions: announce + empty", async () => {
		const { comboboxLiveRegions } = await import("./a11y.js");
		expect(comboboxLiveRegions.length).toBe(2);
		const announce = comboboxLiveRegions.find((lr) => lr.slot === "announce");
		const empty = comboboxLiveRegions.find((lr) => lr.slot === "empty");
		expect(announce).toBeDefined();
		expect(empty).toBeDefined();
		expect(announce?.politeness).toBe("polite");
		expect(announce?.atomic).toBe(true);
	});

	test("keyboard map: includes global + per-slot entries", async () => {
		const { comboboxKeyboardMap } = await import("./a11y.js");
		expect(comboboxKeyboardMap.length).toBeGreaterThanOrEqual(7);
		const keys = comboboxKeyboardMap.map((k) => k.key);
		expect(keys).toContain("ArrowDown");
		expect(keys).toContain("ArrowUp");
		expect(keys).toContain("Enter");
		expect(keys).toContain("Escape");
	});

	test("announcements: resultCount messages", async () => {
		const { comboboxAnnouncements } = await import("./a11y.js");
		expect(comboboxAnnouncements.resultCount(0)).toBe("No results found");
		expect(comboboxAnnouncements.resultCount(1)).toBe("1 result available");
		expect(comboboxAnnouncements.resultCount(5)).toBe("5 results available");
	});

	test("announcements: selected message", async () => {
		const { comboboxAnnouncements } = await import("./a11y.js");
		expect(comboboxAnnouncements.selected("Mango")).toBe("Selected: Mango");
	});

	test("WAI-Adapt: root attrs", async () => {
		const { comboboxAdaptAttrs } = await import("./a11y.js");
		expect(comboboxAdaptAttrs["data-adapt-action"]).toBe("filter");
		expect(comboboxAdaptAttrs["data-adapt-purpose"]).toBe("search-term");
		expect(comboboxAdaptAttrs["data-adapt-simplification"]).toBe("critical");
	});

	test("WAI-Adapt: slot attrs", async () => {
		const { comboboxSlotAdapt } = await import("./a11y.js");
		const inputAdapt = comboboxSlotAdapt("input");
		expect(inputAdapt["data-adapt-action"]).toBe("filter");
		expect(inputAdapt["data-adapt-purpose"]).toBe("search-term");
		const triggerAdapt = comboboxSlotAdapt("trigger");
		expect(triggerAdapt["data-adapt-action"]).toBe("open-listbox");
	});

	test("relationships: input → content via aria-controls", async () => {
		const { comboboxRelationships } = await import("./a11y.js");
		const controlsRel = comboboxRelationships.find(
			(r) => r.attr === "aria-controls" && r.sourceSlot === "input",
		);
		expect(controlsRel).toBeDefined();
		expect(controlsRel?.targetSlot).toBe("content");
		expect(controlsRel?.required).toBe(true);
	});

	test("contract audit passes", async () => {
		const { auditCombobox } = await import("./a11y.js");
		const report = auditCombobox();
		expect(report.kind).toBe("combobox");
		expect(report.valid).toBe(true);
		expect(report.errorCount).toBe(0);
	});
});

// =============================================================================
// SYSTEM-LEVEL A11Y UTILITIES
// =============================================================================

describe("combobox — system a11y utilities", () => {
	test("validateAccessibleName: aria-label passes", async () => {
		const { validateAccessibleName } = await import("../_schema/a11y.js");
		const result = validateAccessibleName({ "aria-label": "Search fruits" });
		expect(result.valid).toBe(true);
		expect(result.source).toBe("aria-label");
		expect(result.name).toBe("Search fruits");
	});

	test("validateAccessibleName: missing name fails when required", async () => {
		const { validateAccessibleName } = await import("../_schema/a11y.js");
		const result = validateAccessibleName({}, undefined, true);
		expect(result.valid).toBe(false);
		expect(result.source).toBe("none");
		expect(result.message).toContain("Missing accessible name");
	});

	test("validateAccessibleName: missing name ok when not required", async () => {
		const { validateAccessibleName } = await import("../_schema/a11y.js");
		const result = validateAccessibleName({}, undefined, false);
		expect(result.valid).toBe(true);
	});

	test("announcements.resultCount standard messages", async () => {
		const { announcements } = await import("../_schema/a11y.js");
		expect(announcements.resultCount(0)).toBe("No results found");
		expect(announcements.resultCount(1)).toBe("1 result available");
		expect(announcements.resultCount(42)).toBe("42 results available");
	});

	test("announcements.position", async () => {
		const { announcements } = await import("../_schema/a11y.js");
		expect(announcements.position(0, 10)).toBe("Item 1 of 10");
		expect(announcements.position(4, 5)).toBe("Item 5 of 5");
	});

	test("announcements.expandedState", async () => {
		const { announcements } = await import("../_schema/a11y.js");
		expect(announcements.expandedState(true)).toBe("Expanded");
		expect(announcements.expandedState(false)).toBe("Collapsed");
	});

	test("extractKeyboardMap returns flat list", async () => {
		const { extractKeyboardMap } = await import("../_schema/a11y.js");
		const map = extractKeyboardMap(contract);
		expect(map.length).toBeGreaterThanOrEqual(7);
		// Global entries have no slot
		const globalEntries = map.filter((e) => !e.slot);
		expect(globalEntries.length).toBe(7);
		// Per-slot entries have a slot name
		const slotEntries = map.filter((e) => e.slot);
		expect(slotEntries.length).toBeGreaterThan(0);
	});

	test("liveRegionAttrs builds correct attributes", async () => {
		const { liveRegionAttrs, createLiveRegionConfigs } = await import("../_schema/a11y.js");
		const configs = createLiveRegionConfigs(contract);
		const announce = configs.find((c) => c.slot === "announce")!;
		const attrs = liveRegionAttrs(announce);
		expect(attrs["aria-live"]).toBe("polite");
		expect(attrs["aria-atomic"]).toBe("true");
	});

	test("auditContract validates contract structure", async () => {
		const { auditContract } = await import("../_schema/a11y.js");
		const report = auditContract(contract);
		expect(report.kind).toBe("combobox");
		expect(report.valid).toBe(true);
		expect(report.errorCount).toBe(0);
	});
});
