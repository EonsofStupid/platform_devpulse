/**
 * @file Select Taxonomy Types
 * @description Type vocabulary for the select primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "select"
 * ariaStateProvider: "meltui" — dsAdapter (createSelect) provides ARIA + state.
 * Dropdown selection with listbox keyboard navigation.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the select primitive */
export const selectSlots = [
	"root",
	"trigger",
	"value",
	"content",
	"viewport",
	"item",
	"item-text",
	"group",
	"label",
	"separator",
] as const;

/** Union of select slot names */
export type SelectSlot = (typeof selectSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the select primitive */
export const selectStateTokens = [
	"focused",
	"focus-visible",
	"focus-within",
	"hover",
	"active",
	"disabled",
	"open",
	"selected",
	"hidden",
	"visible",
] as const satisfies readonly StateToken[];

/** Union of select state tokens */
export type SelectState = (typeof selectStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for select */
export const selectSlotStates = {
	root: ["open"],
	trigger: ["focused", "focus-visible", "hover", "active", "disabled"],
	value: [],
	content: ["open", "focus-within"],
	viewport: [],
	item: ["focused", "hover", "active", "disabled", "selected"],
	"item-text": [],
	group: [],
	label: [],
	separator: [],
} as const satisfies SlotStateMap<SelectSlot, SelectState>;
