/**
 * @file Tabs Taxonomy Contract
 * @description ColdLight SSOT contract for the tabs primitive.
 *
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA + state machinery.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * CRITICAL: MeltUI tabs trigger/content are parameterized builders.
 * trigger(value) and content(value) return stores, unlike dialog where
 * all elements are direct stores. This affects primitive implementation.
 */

import type { PrimitiveContract, SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the tabs primitive */
export const tabsSlots = ["root", "list", "trigger", "content"] as const;

/** Union of tabs slot names */
export type TabsSlot = (typeof tabsSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the tabs primitive */
export const tabsStateTokens = [
	"focused",
	"focus-visible",
	"focus-within",
	"hover",
	"active",
	"disabled",
	"hidden",
	"visible",
	"selected",
] as const satisfies readonly StateToken[];

/** Union of tabs state tokens */
export type TabsState = (typeof tabsStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for tabs */
export const tabsSlotStates = {
	root: [],
	list: ["focus-within"],
	trigger: ["selected", "focused", "focus-visible", "hover", "active", "disabled"],
	content: ["hidden", "visible"],
} as const satisfies SlotStateMap<TabsSlot, TabsState>;

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Tabs primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"tabs", TabsSlot, TabsState> = {
	kind: "tabs",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "list", "trigger", "content"],
		optional: [],
		forbidden: [],
	},
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active", "disabled"],
		specific: ["hidden", "visible", "selected"],
	},
	slotStates: tabsSlotStates,
	slotActions: {
		root: [],
		list: [],
		trigger: [],
		content: [],
	},
	aria: {
		role: "tablist",
		requiredAttrs: ["aria-orientation"],
		optionalAttrs: [],
	},
	keyboard: ["ArrowLeft", "ArrowRight", "Home", "End", "Enter", "Space"],
};
