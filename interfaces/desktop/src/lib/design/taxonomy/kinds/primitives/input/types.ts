/**
 * @file Input Taxonomy Types
 * @description Type vocabulary for the input primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "input"
 * ariaStateProvider: "coldlight" — native <input> handles semantics.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the input primitive */
export const inputSlots = ["root"] as const;

/** Union of input slot names */
export type InputSlot = (typeof inputSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the input primitive */
export const inputStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
	"readonly",
	"invalid",
	"valid",
	"required",
] as const satisfies readonly StateToken[];

/** Union of input state tokens */
export type InputState = (typeof inputStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for input */
export const inputSlotStates = {
	root: ["focused", "focus-visible", "hover", "active", "disabled", "readonly", "invalid", "valid", "required"],
} as const satisfies SlotStateMap<InputSlot, InputState>;
