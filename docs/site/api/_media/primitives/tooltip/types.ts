/**
 * @file primitives/tooltip/types.ts
 * @kind tooltip
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Tooltip primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via transport chain.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the tooltip primitive */
export const tooltipSlots = ["trigger", "content", "arrow"] as const;
export type TooltipSlot = (typeof tooltipSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the tooltip primitive */
export const tooltipStateTokens = [
	"open",
	"closed",
	"focused",
	"focus-visible",
	"hover",
] as const satisfies readonly StateToken[];
export type TooltipState = (typeof tooltipStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each tooltip slot to its allowed state tokens */
export const tooltipSlotStates = {
	trigger: ["focused", "focus-visible", "hover"],
	content: ["open", "closed"],
	arrow: [],
} as const satisfies SlotStateMap<TooltipSlot, TooltipState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * TooltipTriggerProps — props for the tooltip trigger slot.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 *
 * Extends any HTML element attrs — the trigger can be any focusable element.
 */
export interface TooltipTriggerProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {}

/**
 * TooltipContentProps — props for the tooltip content slot.
 */
export interface TooltipContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {}

/**
 * TooltipArrowProps — props for the tooltip arrow slot.
 */
export interface TooltipArrowProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {}
