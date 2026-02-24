/**
 * @file primitives/collapsible/types.ts
 * @kind collapsible
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Collapsible primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter owns ARIA via transport chain.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes, HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the collapsible primitive */
export const collapsibleSlots = ["trigger", "content"] as const;
export type CollapsibleSlot = (typeof collapsibleSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the collapsible primitive */
export const collapsibleStateTokens = [
	"open",
	"closed",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type CollapsibleState = (typeof collapsibleStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each collapsible slot to its allowed state tokens */
export const collapsibleSlotStates = {
	trigger: ["open", "focused", "focus-visible", "hover", "disabled"],
	content: ["open", "closed"],
} as const satisfies SlotStateMap<CollapsibleSlot, CollapsibleState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * CollapsibleTriggerProps — props for the collapsible trigger button.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface CollapsibleTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * CollapsibleContentProps — props for the collapsible content region.
 */
export interface CollapsibleContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
