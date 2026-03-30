/**
 * @file Nav Component Types
 * @kind nav
 * @layer components
 *
 * Extends primitive with ARIA label and sizing.
 * Component layer owns ARIA -- primitive is structureless.
 */

import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

export type NavSize = "sm" | "md" | "lg";
export type NavOrientation = "horizontal" | "vertical";
export type NavPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** Nav component props — ColdLight 8-axis + ARIA + composition */
export interface NavComponentProps
	extends UIBaseProps,
		Omit<HTMLAttributes<HTMLElement>, "children" | "class"> {
	/** Style preset */
	preset?: NavPreset;
	/** Accessible label for the navigation landmark */
	label?: string;
	/** Size variant */
	size?: NavSize;
	/** Layout orientation */
	orientation?: NavOrientation;
}
