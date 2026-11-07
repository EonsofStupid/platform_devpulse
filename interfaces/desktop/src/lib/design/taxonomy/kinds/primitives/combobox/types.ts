/**
 * @file Combobox Taxonomy Types
 * @description Type vocabulary for the combobox primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "combobox"
 * ariaStateProvider: "meltui" — createCombobox provides ARIA roles, keyboard nav, and filtering.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the combobox primitive */
export const comboboxSlots = [
	"root",
	"input",
	"trigger",
	"content",
	"item",
	"group",
	"empty",
] as const;

/** Union of combobox slot names */
export type ComboboxSlot = (typeof comboboxSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the combobox primitive */
export const comboboxStateTokens = [
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
	"open",
	"closed",
	"selected",
	"checked",
] as const satisfies readonly StateToken[];

/** Union of combobox state tokens */
export type ComboboxState = (typeof comboboxStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for combobox */
export const comboboxSlotStates = {
	root: [],
	input: ["focused", "focus-visible", "disabled"],
	trigger: ["hover", "active", "disabled"],
	content: ["open", "closed"],
	item: ["hover", "active", "focused", "focus-visible", "disabled", "selected", "checked"],
	group: [],
	empty: [],
} as const satisfies SlotStateMap<ComboboxSlot, ComboboxState>;
