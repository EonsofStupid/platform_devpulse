/**
 * @file Dialog Taxonomy Contract
 * @description ColdLight SSOT contract for the dialog primitive.
 *
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA + state machinery.
 * 3-folder parity: taxonomy + adapter + primitive.
 */

import type { PrimitiveContract, SlotStateMap, StateToken } from "../../../types.js";

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
	"entering",
	"exiting",
] as const satisfies readonly StateToken[];

/** Union of dialog state tokens */
export type DialogState = (typeof dialogStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for dialog */
export const dialogSlotStates = {
	root: ["open"],
	trigger: ["focused", "focus-visible", "hover", "active"],
	portal: ["hidden", "visible"],
	overlay: ["visible", "entering", "exiting", "hover"],
	content: ["open", "focus-within", "entering", "exiting"],
	title: [],
	description: [],
	close: ["focused", "focus-visible", "hover", "active"],
} as const satisfies SlotStateMap<DialogSlot, DialogState>;

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Dialog primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"dialog", DialogSlot, DialogState> = {
	kind: "dialog",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "content"],
		optional: ["trigger", "portal", "overlay", "title", "description", "close"],
		forbidden: [],
	},
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["hidden", "visible", "inert", "open", "entering", "exiting"],
	},
	slotStates: dialogSlotStates,
	slotActions: {
		root: [],
		trigger: [],
		portal: [],
		overlay: [],
		content: [],
		title: [],
		description: [],
		close: [],
	},
	aria: {
		role: "dialog",
		requiredAttrs: ["aria-modal", "aria-labelledby"],
		optionalAttrs: ["aria-describedby"],
	},
	keyboard: ["Escape", "Tab"],
};
