/**
 * @file ColorArea Component Types
 * @kind color-area
 * @layer components
 *
 * 2D color picker surface. User drags a thumb to select two color channels
 * simultaneously (e.g., saturation on X, lightness on Y).
 *
 * Behavioral — pointer tracking, keyboard arrow keys, form integration.
 * Spectrum-aligned API: controlled/uncontrolled, color space, channels,
 * onChange/onChangeEnd, form association.
 *
 * Color represented as oklch string (matches SD5 token pipeline output).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

// =============================================================================
// COLOR TYPES
// =============================================================================

/** Supported color spaces. oklch is the ColdLight default (matches SD5 pipeline). */
export type ColorSpace = "oklch" | "hsl" | "hsb" | "rgb";

/** Color channel identifiers per color space. */
export type ColorChannel =
	| "hue" | "saturation" | "lightness" | "brightness"
	| "chroma" | "red" | "green" | "blue" | "alpha";

/** Color value — string representation (e.g., "oklch(0.65 0.12 176)"). */
export type ColorValue = string;

// =============================================================================
// CALLBACK DETAILS
// =============================================================================

export interface ColorAreaChangeDetails {
	value: ColorValue;
}

// =============================================================================
// IDS
// =============================================================================

export interface ColorAreaIds {
	root?: string;
	thumb?: string;
	xInput?: string;
	yInput?: string;
}

// =============================================================================
// ROOT
// =============================================================================

export interface ColorAreaRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir">,
		ComponentProps {
	ids?: Partial<ColorAreaIds>;
	/** Color space the area operates in. Default: "oklch". */
	colorSpace?: ColorSpace;
	/** Color channel for the horizontal axis. */
	xChannel: ColorChannel;
	/** Color channel for the vertical axis. */
	yChannel: ColorChannel;
	/** Name for the x channel input (form submission). */
	xName?: string;
	/** Name for the y channel input (form submission). */
	yName?: string;
	/** Controlled color value. */
	value?: ColorValue;
	/** Initial value when uncontrolled. */
	defaultValue?: ColorValue;
	/** Callback as the user drags. */
	onChange?: (details: ColorAreaChangeDetails) => void;
	/** Callback when the user stops dragging. */
	onChangeEnd?: (details: ColorAreaChangeDetails) => void;
	/** Whether the color area is disabled. */
	isDisabled?: boolean;
	/** The form element to associate with (form ID). */
	form?: string;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	/** Step size for keyboard channel adjustment. Default: 1. */
	step?: number;
	children?: Snippet;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ColorAreaSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

/** The draggable thumb indicator. */
export interface ColorAreaThumbProps extends ColorAreaSlotProps {}

/** The gradient background surface. */
export interface ColorAreaGradientProps extends ColorAreaSlotProps {}
