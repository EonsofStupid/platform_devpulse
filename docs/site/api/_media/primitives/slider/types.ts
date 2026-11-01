/**
 * @file primitives/slider/types.ts
 * @kind slider
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Slider primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter owns ARIA via transport chain.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the slider primitive */
export const sliderSlots = ["root", "thumb", "range"] as const;
export type SliderSlot = (typeof sliderSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the slider primitive */
export const sliderStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type SliderState = (typeof sliderStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each slider slot to its allowed state tokens */
export const sliderSlotStates = {
	root: ["disabled"],
	thumb: ["focused", "focus-visible", "hover", "disabled"],
	range: [],
} as const satisfies SlotStateMap<SliderSlot, SliderState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * SliderRootProps — props for the slider root container.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface SliderRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * SliderThumbProps — props for the slider thumb element.
 */
export interface SliderThumbProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * SliderRangeProps — props for the slider range indicator.
 */
export interface SliderRangeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
