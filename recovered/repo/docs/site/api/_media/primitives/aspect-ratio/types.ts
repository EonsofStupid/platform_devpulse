/**
 * @file primitives/aspect-ratio/types.ts
 * @kind aspect-ratio
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * AspectRatio primitive — Fixed aspect ratio container for media/content.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the aspect-ratio primitive */
export const aspectRatioSlots = ["root"] as const;
export type AspectRatioSlot = (typeof aspectRatioSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the aspect-ratio primitive */
export const aspectRatioStateTokens = [] as const satisfies readonly StateToken[];
export type AspectRatioState = (typeof aspectRatioStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each aspect-ratio slot to its allowed state tokens */
export const aspectRatioSlotStates = {
	root: [],
} as const satisfies SlotStateMap<AspectRatioSlot, AspectRatioState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * AspectRatioProps — props for the aspect-ratio primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface AspectRatioProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
