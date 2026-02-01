/**
 * @file AlertDialog Taxonomy Types
 * @description Type vocabulary for the alert-dialog primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "alert-dialog"
 * ariaStateProvider: "meltui" — dsAdapter (createDialog) provides ARIA + state.
 * Non-dismissible dialog requiring explicit user action (cancel or confirm).
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the alert-dialog primitive */
export const alertDialogSlots = [
	"root",
	"trigger",
	"portal",
	"overlay",
	"content",
	"title",
	"description",
	"cancel",
	"action",
] as const;

/** Union of alert-dialog slot names */
export type AlertDialogSlot = (typeof alertDialogSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the alert-dialog primitive */
export const alertDialogStateTokens = [
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

/** Union of alert-dialog state tokens */
export type AlertDialogState = (typeof alertDialogStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for alert-dialog */
export const alertDialogSlotStates = {
	root: ["open", "closed"],
	trigger: ["focused", "focus-visible", "hover", "active"],
	portal: ["hidden", "visible"],
	overlay: ["visible", "entering", "exiting"],
	content: ["open", "closed", "focus-within", "entering", "exiting"],
	title: [],
	description: [],
	cancel: ["focused", "focus-visible", "hover", "active"],
	action: ["focused", "focus-visible", "hover", "active"],
} as const satisfies SlotStateMap<AlertDialogSlot, AlertDialogState>;
