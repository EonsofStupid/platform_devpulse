/**
 * @file primitives/search-input/types.ts
 * @kind search-input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Search-input primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/search-input/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the search-input primitive */
export const searchInputSlots = ["root", "input", "icon", "clear"] as const;
export type SearchInputSlot = (typeof searchInputSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the search-input primitive */
export const searchInputStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type SearchInputState = (typeof searchInputStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each search-input slot to its allowed state tokens */
export const searchInputSlotStates = {
	root: ["focused", "focus-visible", "hover", "disabled"],
	input: ["focused", "focus-visible", "disabled"],
	icon: [],
	clear: ["hover", "focused", "focus-visible"],
} as const satisfies SlotStateMap<SearchInputSlot, SearchInputState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * SearchInputRootProps — props for the search-input root primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 */
export interface SearchInputRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
