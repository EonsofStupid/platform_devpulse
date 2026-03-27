/**
 * @file ColorSlider Component Types
 * @kind color-slider
 * @layer components
 *
 * 1D color channel slider. Single thumb on a gradient track.
 * Compound: Root, Track, Thumb.
 * Spectrum-aligned: channel, colorSpace, orientation, controlled/uncontrolled.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { ColorChannel, ColorSpace, ColorValue } from "$lib/design/components/color-area/types.js";

// =============================================================================
// SHARED
// =============================================================================

export type SliderOrientation = "horizontal" | "vertical";

export type ColorSliderPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface ColorSliderChangeDetails {
	value: ColorValue;
}

export interface ColorSliderIds {
	root?: string;
	track?: string;
	thumb?: string;
	label?: string;
	input?: string;
}

// =============================================================================
// ROOT
// =============================================================================

export interface ColorSliderRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir">,
		ComponentProps {
	ids?: Partial<ColorSliderIds>;
	/** Color channel this slider controls. Required. */
	channel: ColorChannel;
	/** Color space. Default: "oklch". */
	colorSpace?: ColorSpace;
	/** Orientation. Default: "horizontal". */
	orientation?: SliderOrientation;
	/** Controlled value. */
	value?: ColorValue;
	/** Initial value when uncontrolled. */
	defaultValue?: ColorValue;
	/** Callback as the user drags. */
	onChange?: (details: ColorSliderChangeDetails) => void;
	/** Callback when the user stops dragging. */
	onChangeEnd?: (details: ColorSliderChangeDetails) => void;
	/** Whether the slider is disabled. */
	isDisabled?: boolean;
	/** Label text. */
	label?: string;
	/** Input name for form submission. */
	name?: string;
	/** Form element ID. */
	form?: string;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	/** Keyboard step size. Default: 1. */
	step?: number;
	/** Style preset. Default: "default". */
	preset?: ColorSliderPreset;
	children?: Snippet;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ColorSliderSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

export interface ColorSliderTrackProps extends ColorSliderSlotProps {}
export interface ColorSliderThumbProps extends ColorSliderSlotProps {}
