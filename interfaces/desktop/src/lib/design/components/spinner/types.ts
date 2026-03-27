/**
 * @file Spinner Types
 * @kind spinner
 * @layer components
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type SpinnerSize = "sm" | "md" | "lg";

export type SpinnerPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface SpinnerProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class">,
		ComponentProps {
	active?: boolean;
	size?: SpinnerSize;
	/** Style preset. Default: "default". */
	preset?: SpinnerPreset;
}
