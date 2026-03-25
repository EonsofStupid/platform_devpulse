/**
 * @file Nav Component Types
 * @kind nav
 * @layer components
 *
 * Extends primitive with ARIA label and sizing.
 * Component layer owns ARIA -- primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type NavSize = "sm" | "md" | "lg";
export type NavOrientation = "horizontal" | "vertical";
export type NavIntent = "default" | "stark" | "glass" | "flat" | "matte";

/** Nav component props — ColdLight 8-axis + ARIA + composition */
export interface NavComponentProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Style intent preset */
	intent?: NavIntent;
	/** Accessible label for the navigation landmark */
	label?: string;
	/** Size variant */
	size?: NavSize;
	/** Layout orientation */
	orientation?: NavOrientation;
}
