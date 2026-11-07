/**
 * @file primitives/banner/types.ts
 * @kind banner
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Banner primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/banner/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the banner primitive */
export const bannerSlots = ["root", "icon", "content", "action"] as const;
export type BannerSlot = (typeof bannerSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the banner primitive (none) */
export const bannerStateTokens = [] as const satisfies readonly StateToken[];
export type BannerState = (typeof bannerStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each banner slot to its allowed state tokens */
export const bannerSlotStates = {
	root: [],
	icon: [],
	content: [],
	action: [],
} as const satisfies SlotStateMap<BannerSlot, BannerState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * BannerProps — props for the structureless banner primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/banner/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
