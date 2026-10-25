/**
 * @file primitives/color-input/types.ts
 * @kind color-input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * ColorInput primitive — Color picker input with swatch preview.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the color-input primitive */
export const colorInputSlots = ["root", "swatch", "input", "label"] as const;
export type ColorInputSlot = (typeof colorInputSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the color-input primitive */
export const colorInputStateTokens = [
	"focused",
	"focus-visible",
	"disabled",
	"invalid",
] as const satisfies readonly StateToken[];
export type ColorInputState = (typeof colorInputStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each color-input slot to its allowed state tokens */
export const colorInputSlotStates = {
	root: ["disabled", "invalid"],
	swatch: [],
	input: ["focused", "focus-visible", "disabled", "invalid"],
	label: [],
} as const satisfies SlotStateMap<ColorInputSlot, ColorInputState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * ColorInputRootProps — props for the color-input primitive root slot (div).
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface ColorInputRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * ColorInputInputProps — props for the color-input primitive input slot.
 *
 * Self-closing element. No children snippet.
 */
export interface ColorInputInputProps extends Omit<HTMLInputAttributes, "style" | "children">, BaseProps {}
