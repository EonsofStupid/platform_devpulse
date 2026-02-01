/**
 * @file Switch Taxonomy Types
 * @description Type vocabulary for the switch primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "switch"
 * ariaStateProvider: "coldlight" — native <button> with role="switch" + aria-checked at component layer.
 * Binary on/off toggle with visual thumb indicator.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the switch primitive */
export const switchSlots = ["root", "thumb"] as const;

/** Union of switch slot names */
export type SwitchSlot = (typeof switchSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the switch primitive */
export const switchStateTokens = [
	"checked",
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of switch state tokens */
export type SwitchState = (typeof switchStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for switch */
export const switchSlotStates = {
	root: ["checked", "hover", "active", "focused", "focus-visible", "disabled"],
	thumb: ["checked"],
} as const satisfies SlotStateMap<SwitchSlot, SwitchState>;
