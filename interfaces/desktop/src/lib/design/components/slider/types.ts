/**
 * @file Slider Component Types
 * @kind slider
 * @layer components
 *
 * Compound component props for Slider root + sub-components.
 * MeltUI transport adapter provides ARIA — types declare structural props only.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export interface SliderProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
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
}

export interface SliderTrackProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

export interface SliderRangeProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {}

export interface SliderThumbProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
