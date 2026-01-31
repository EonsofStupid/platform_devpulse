/**
 * @file Button Taxonomy Contract
 * @description ColdLight SSOT contract for the button primitive.
 *
 * ariaStateProvider: "coldlight" — Native <button> handles ARIA.
 * No dsAdapter factory required. 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract, SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the button primitive */
export const buttonSlots = ["root", "icon", "label"] as const;

/** Union of button slot names */
export type ButtonSlot = (typeof buttonSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the button primitive */
export const buttonStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
	"pressed",
	"loading",
	"busy",
] as const satisfies readonly StateToken[];

/** Union of button state tokens */
export type ButtonState = (typeof buttonStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for button */
export const buttonSlotStates = {
	root: ["focused", "focus-visible", "hover", "active", "disabled", "pressed", "loading", "busy"],
	icon: [],
	label: [],
} as const satisfies SlotStateMap<ButtonSlot, ButtonState>;

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Button primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"button", ButtonSlot, ButtonState> = {
	kind: "button",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root"],
		optional: ["icon", "label"],
		forbidden: [],
	},
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["pressed", "loading", "busy"],
	},
	slotStates: buttonSlotStates,
	slotActions: {
		root: [],
		icon: [],
		label: [],
	},
	aria: {
		role: "button",
		requiredAttrs: [],
		optionalAttrs: ["aria-pressed", "aria-disabled", "aria-busy"],
	},
	keyboard: ["Enter", "Space"],
};
