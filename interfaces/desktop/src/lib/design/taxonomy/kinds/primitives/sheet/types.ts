/**
 * @file Sheet Taxonomy Types
 * @description Type vocabulary for the sheet primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "sheet"
 * ariaStateProvider: "meltui" — dsAdapter (createDialog) provides ARIA + state.
 * Structurally a side-anchored dialog with header/footer layout slots.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the sheet primitive */
export const sheetSlots = [
	"root",
	"trigger",
	"portal",
	"overlay",
	"content",
	"header",
	"footer",
	"title",
	"description",
	"close",
] as const;

/** Union of sheet slot names */
export type SheetSlot = (typeof sheetSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the sheet primitive */
export const sheetStateTokens = [
	"focused",
	"focus-visible",
	"focus-within",
	"hover",
	"active",
	"hidden",
	"visible",
	"open",
	"closed",
	"entering",
	"exiting",
] as const satisfies readonly StateToken[];

/** Union of sheet state tokens */
export type SheetState = (typeof sheetStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for sheet */
export const sheetSlotStates = {
	root: ["open", "closed"],
	trigger: ["focused", "focus-visible", "hover", "active"],
	portal: ["hidden", "visible"],
	overlay: ["visible", "entering", "exiting", "hover"],
	content: ["open", "closed", "focus-within", "entering", "exiting"],
	header: [],
	footer: [],
	title: [],
	description: [],
	close: ["focused", "focus-visible", "hover", "active"],
} as const satisfies SlotStateMap<SheetSlot, SheetState>;
