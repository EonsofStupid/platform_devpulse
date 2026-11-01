/**
 * @file primitives/callout/types.ts
 * @kind callout
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Callout primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/callout/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the callout primitive */
export const calloutSlots = ["root", "icon", "content"] as const;
export type CalloutSlot = (typeof calloutSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the callout primitive (none) */
export const calloutStateTokens = [] as const satisfies readonly StateToken[];
export type CalloutState = (typeof calloutStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each callout slot to its allowed state tokens */
export const calloutSlotStates = {
	root: [],
	icon: [],
	content: [],
} as const satisfies SlotStateMap<CalloutSlot, CalloutState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * CalloutProps — props for the structureless callout primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/callout/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
