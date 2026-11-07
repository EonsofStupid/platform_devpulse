/**
 * @file primitives/list/types.ts
 * @kind list
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * List primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/list/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the list primitive */
export const listSlots = ["root", "item"] as const;
export type ListSlot = (typeof listSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the list primitive */
export const listStateTokens = [] as const satisfies readonly StateToken[];
export type ListState = (typeof listStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each list slot to its allowed state tokens */
export const listSlotStates = {
	root: [],
	item: [],
} as const satisfies SlotStateMap<ListSlot, ListState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * ListProps — props for the structureless list primitive (root slot).
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/list/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface ListProps extends Omit<HTMLAttributes<HTMLUListElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * ListItemProps — props for the list item primitive (item slot).
 *
 * Zero ARIA. Zero state logic. Zero styling.
 */
export interface ListItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
