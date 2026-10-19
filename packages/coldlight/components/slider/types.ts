/**
 * @file Slider Component Types
 * @kind slider
 * @layer components
 *
 * Compound component props for Slider root + sub-components.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { SliderPrimitiveProps } from "#coldlight/behaviors/inputs/slider/index.js";

export type SliderPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface SliderProps extends SliderPrimitiveProps {
	children?: Snippet;
	/** Minimum value. @default 0 */
	min?: number;
	/** Maximum value. @default 100 */
	max?: number;
	/** Current value. */
	value?: number;
	/** Step increment. @default 1 */
	step?: number;
	/** Slider orientation. @default "horizontal" */
	orientation?: "horizontal" | "vertical";
	/** Called when value changes. */
	onValueChange?: (value: number) => void;
	/** Whether the slider is disabled. */
	disabled?: boolean;
	/** Style preset. Default: "default". */
	preset?: SliderPreset;
}

export interface SliderTrackProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}

export interface SliderRangeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	class?: string;
}

export interface SliderThumbProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
	children?: Snippet;
	class?: string;
}
