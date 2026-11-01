/**
 * @file primitives/toaster/types.ts
 * @kind toaster
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toaster primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA + state via transport chain.
 *
 * Builder: new Toaster()
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes, HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the toaster primitive */
export const toasterSlots = ["root", "content", "title", "description", "close"] as const;
export type ToasterSlot = (typeof toasterSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the toaster primitive */
export const toasterStateTokens = [
	"open",
	"closed",
	"focused",
	"focus-visible",
] as const satisfies readonly StateToken[];
export type ToasterState = (typeof toasterStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each toaster slot to its allowed state tokens */
export const toasterSlotStates = {
	root: [],
	content: ["open", "closed"],
	title: [],
	description: [],
	close: ["focused", "focus-visible"],
} as const satisfies SlotStateMap<ToasterSlot, ToasterState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * ToasterRootProps — props for the toaster root slot.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 */
export interface ToasterRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {}

/**
 * ToastContentProps — props for each toast content slot.
 */
export interface ToastContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/**
 * ToastCloseProps — props for the toast close button slot.
 */
export interface ToastCloseProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
