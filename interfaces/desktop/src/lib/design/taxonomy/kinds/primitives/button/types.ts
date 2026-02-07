/**
 * @file Button Taxonomy Types
 * @description Type vocabulary for the button primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "button"
 * ariaStateProvider: "coldlight" — native <button> handles ARIA.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

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
