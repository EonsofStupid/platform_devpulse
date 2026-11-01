/**
 * @file primitives/popover/types.ts
 * @kind popover
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Popover primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via transport chain.
 *
 * WAI-ARIA APG: Non-modal dialog pattern
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes, HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the popover primitive */
export const popoverSlots = ["trigger", "content", "arrow"] as const;
export type PopoverSlot = (typeof popoverSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the popover primitive */
export const popoverStateTokens = [
	"open",
	"closed",
	"focused",
	"focus-visible",
] as const satisfies readonly StateToken[];
export type PopoverState = (typeof popoverStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each popover slot to its allowed state tokens */
export const popoverSlotStates = {
	trigger: ["focused", "focus-visible"],
	content: ["open", "closed"],
	arrow: [],
} as const satisfies SlotStateMap<PopoverSlot, PopoverState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * PopoverTriggerProps — props for the popover trigger slot.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface PopoverTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * PopoverContentProps — props for the popover content slot.
 */
export interface PopoverContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * PopoverArrowProps — props for the popover arrow slot.
 */
export interface PopoverArrowProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {}
