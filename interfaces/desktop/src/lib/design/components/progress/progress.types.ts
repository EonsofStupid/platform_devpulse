/**
 * @file Progress Types
 * @kind progress
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressProps
	extends ComponentProps,
		Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class"> {
	/** Current value (null = indeterminate) */
	value?: number | null;
	/** Minimum value */
	min?: number;
	/** Maximum value */
	max?: number;
	/** Size — structural class */
	size?: ProgressSize;
	/** Accessible label */
	"aria-label"?: string;
	/** ID of labelling element */
	"aria-labelledby"?: string;
}
