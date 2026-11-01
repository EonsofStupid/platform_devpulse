/**
 * @file primitives/pin-input/types.ts
 * @kind pin-input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Pin-input primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA + state via transport chain.
 *
 * Builder: new PinInput()
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the pin-input primitive */
export const pinInputSlots = ["root", "input"] as const;
export type PinInputSlot = (typeof pinInputSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the pin-input primitive */
export const pinInputStateTokens = [
	"focused",
	"focus-visible",
	"disabled",
] as const satisfies readonly StateToken[];
export type PinInputState = (typeof pinInputStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each pin-input slot to its allowed state tokens */
export const pinInputSlotStates = {
	root: ["disabled"],
	input: ["focused", "focus-visible", "disabled"],
} as const satisfies SlotStateMap<PinInputSlot, PinInputState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * PinInputRootProps — props for the pin-input root slot.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 */
export interface PinInputRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/**
 * PinInputFieldProps — props for each pin-input field slot.
 */
export interface PinInputFieldProps extends Omit<HTMLInputAttributes, "style" | "children">, BaseProps {}
