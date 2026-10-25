/**
 * @file Spinner Taxonomy Types
 * @description Type vocabulary for the spinner primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "spinner"
 * ariaStateProvider: "coldlight" — polite live region announcing loading state to assistive technology.
 * Indeterminate loading indicator (no progress value).
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the spinner primitive */
export const spinnerSlots = ["root"] as const;

/** Union of spinner slot names */
export type SpinnerSlot = (typeof spinnerSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the spinner primitive */
export const spinnerStateTokens = [
	"loading",
	"visible",
	"hidden",
] as const satisfies readonly StateToken[];

/** Union of spinner state tokens */
export type SpinnerState = (typeof spinnerStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for spinner */
export const spinnerSlotStates = {
	root: ["loading", "visible", "hidden"],
} as const satisfies SlotStateMap<SpinnerSlot, SpinnerState>;
