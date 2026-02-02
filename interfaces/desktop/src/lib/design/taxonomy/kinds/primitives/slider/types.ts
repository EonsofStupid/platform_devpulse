/**
 * @file Slider Taxonomy Types
 * @description Type vocabulary for the slider primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "slider"
 * ariaStateProvider: "meltui" — createSlider provides ARIA range widget + keyboard interaction.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the slider primitive */
export const sliderSlots = ["root", "track", "range", "thumb"] as const;

/** Union of slider slot names */
export type SliderSlot = (typeof sliderSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the slider primitive */
export const sliderStateTokens = [
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of slider state tokens */
export type SliderState = (typeof sliderStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for slider */
export const sliderSlotStates = {
	root: ["hover", "active", "disabled"],
	track: [],
	range: [],
	thumb: ["hover", "active", "focused", "focus-visible", "disabled"],
} as const satisfies SlotStateMap<SliderSlot, SliderState>;
