/**
 * @file primitives/breadcrumb/types.ts
 * @kind breadcrumb
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Breadcrumb primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/breadcrumb/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the breadcrumb primitive */
export const breadcrumbSlots = ["root", "item", "separator"] as const;
export type BreadcrumbSlot = (typeof breadcrumbSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the breadcrumb primitive (none) */
export const breadcrumbStateTokens = [] as const satisfies readonly StateToken[];
export type BreadcrumbState = (typeof breadcrumbStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each breadcrumb slot to its allowed state tokens */
export const breadcrumbSlotStates = {
	root: [],
	item: [],
	separator: [],
} as const satisfies SlotStateMap<BreadcrumbSlot, BreadcrumbState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * BreadcrumbProps — props for the structureless breadcrumb primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/breadcrumb/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface BreadcrumbProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
