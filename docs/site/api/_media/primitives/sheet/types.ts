/**
 * @file primitives/sheet/types.ts
 * @kind sheet
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Sheet primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/sheet/).
 *
 * Sheet is a slide-in panel overlay pattern.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the sheet primitive */
export const sheetSlots = ["trigger", "overlay", "content", "close"] as const;
export type SheetSlot = (typeof sheetSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the sheet primitive */
export const sheetStateTokens = [
	"open",
	"closed",
	"focused",
	"focus-visible",
] as const satisfies readonly StateToken[];
export type SheetState = (typeof sheetStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each sheet slot to its allowed state tokens */
export const sheetSlotStates = {
	trigger: ["focused", "focus-visible"],
	overlay: ["open", "closed"],
	content: ["open", "closed"],
	close: ["focused", "focus-visible"],
} as const satisfies SlotStateMap<SheetSlot, SheetState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * SheetTriggerProps — props for the sheet trigger primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 */
export interface SheetTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * SheetContentProps — props for the sheet content primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 */
export interface SheetContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
