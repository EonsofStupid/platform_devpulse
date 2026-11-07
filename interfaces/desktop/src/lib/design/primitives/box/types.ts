/**
 * @file primitives/box/types.ts
 * @kind box
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Box primitive — base layout container, polymorphic via `as` prop.
 * Token-driven spacing/sizing. No ARIA complexity.
 *
 * ariaStateProvider: "coldlight" — native HTML semantics.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

export const boxSlots = ["root"] as const;
export type BoxSlot = (typeof boxSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

export const boxStateTokens = [] as const satisfies readonly StateToken[];
export type BoxState = (typeof boxStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

export const boxSlotStates = {
	root: [],
} as const satisfies SlotStateMap<BoxSlot, BoxState>;

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface BoxProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Polymorphic element tag */
	as?: "div" | "section" | "article" | "aside" | "main" | "header" | "footer" | "nav" | "span";
}
