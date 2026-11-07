/**
 * @file primitives/description-list/types.ts
 * @kind description-list
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * DescriptionList primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/description-list/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the description-list primitive */
export const descriptionListSlots = ["root", "term", "detail"] as const;
export type DescriptionListSlot = (typeof descriptionListSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the description-list primitive */
export const descriptionListStateTokens = [] as const satisfies readonly StateToken[];
export type DescriptionListState = (typeof descriptionListStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each description-list slot to its allowed state tokens */
export const descriptionListSlotStates = {
	root: [],
	term: [],
	detail: [],
} as const satisfies SlotStateMap<DescriptionListSlot, DescriptionListState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * DescriptionListProps — props for the structureless description-list primitive (root slot).
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/description-list/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface DescriptionListProps extends Omit<HTMLAttributes<HTMLDListElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * DescriptionListTermProps — props for the description-list term primitive (term slot).
 *
 * Zero ARIA. Zero state logic. Zero styling.
 */
export interface DescriptionListTermProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * DescriptionListDetailProps — props for the description-list detail primitive (detail slot).
 *
 * Zero ARIA. Zero state logic. Zero styling.
 */
export interface DescriptionListDetailProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
