/**
 * @file Dialog Taxonomy Types
 * @description Type vocabulary for the dialog primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "dialog"
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA + state machinery.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the dialog primitive */
export const dialogSlots = [
	"root",
	"trigger",
	"portal",
	"overlay",
	"content",
	"title",
	"description",
	"close",
] as const;

/** Union of dialog slot names */
export type DialogSlot = (typeof dialogSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the dialog primitive */
export const dialogStateTokens = [
	"focused",
	"focus-visible",
	"focus-within",
	"hover",
	"active",
	"hidden",
	"visible",
	"inert",
	"open",
	"closed",
	"entering",
	"exiting",
] as const satisfies readonly StateToken[];

/** Union of dialog state tokens */
export type DialogState = (typeof dialogStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for dialog */
export const dialogSlotStates = {
	root: ["open", "closed"],
	trigger: ["focused", "focus-visible", "hover", "active"],
	portal: ["hidden", "visible"],
	overlay: ["visible", "entering", "exiting", "hover"],
	content: ["open", "closed", "focus-within", "entering", "exiting"],
	title: [],
	description: [],
	close: ["focused", "focus-visible", "hover", "active"],
} as const satisfies SlotStateMap<DialogSlot, DialogState>;
