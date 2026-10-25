/**
 * @file PinInput Taxonomy Types
 * @description Type vocabulary for the pin-input primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "pin-input"
 * ariaStateProvider: "meltui" — createPinInput provides auto-advance, backspace navigation, and paste handling.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the pin-input primitive */
export const pinInputSlots = ["root", "input"] as const;

/** Union of pin-input slot names */
export type PinInputSlot = (typeof pinInputSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the pin-input primitive */
export const pinInputStateTokens = [
	"focused",
	"focus-visible",
	"disabled",
	"invalid",
	"valid",
] as const satisfies readonly StateToken[];

/** Union of pin-input state tokens */
export type PinInputState = (typeof pinInputStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for pin-input */
export const pinInputSlotStates = {
	root: ["disabled"],
	input: ["focused", "focus-visible", "disabled", "invalid", "valid"],
} as const satisfies SlotStateMap<PinInputSlot, PinInputState>;
