/**
 * @file primitives/toolbar/types.ts
 * @kind toolbar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toolbar primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/toolbar/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the toolbar primitive */
export const toolbarSlots = ["root"] as const;
export type ToolbarSlot = (typeof toolbarSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the toolbar primitive (none) */
export const toolbarStateTokens = [] as const satisfies readonly StateToken[];
export type ToolbarState = (typeof toolbarStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each toolbar slot to its allowed state tokens */
export const toolbarSlotStates = {
	root: [],
} as const satisfies SlotStateMap<ToolbarSlot, ToolbarState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * ToolbarProps — props for the structureless toolbar primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/toolbar/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface ToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
