/**
 * @file Command Taxonomy Types
 * @description Type vocabulary for the command primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "command"
 * ariaStateProvider: "coldlight" — native combobox/listbox pattern with activedescendant focus.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the command primitive */
export const commandSlots = [
	"root",
	"input",
	"list",
	"group",
	"item",
	"empty",
	"separator",
] as const;

/** Union of command slot names */
export type CommandSlot = (typeof commandSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the command primitive */
export const commandStateTokens = [
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
	"selected",
] as const satisfies readonly StateToken[];

/** Union of command state tokens */
export type CommandState = (typeof commandStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for command */
export const commandSlotStates = {
	root: ["hover", "active"],
	input: ["focused", "focus-visible", "disabled"],
	list: [],
	group: [],
	item: ["hover", "active", "focused", "focus-visible", "disabled", "selected"],
	empty: [],
	separator: [],
} as const satisfies SlotStateMap<CommandSlot, CommandState>;
