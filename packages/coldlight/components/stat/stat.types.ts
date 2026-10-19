/**
 * @file Stat Types
 * @kind stat
 * @render html
 * @category content
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";

export type StatSize = "sm" | "md" | "lg";

export interface StatProps
	extends UIBaseProps,
		Omit<HTMLAttributes<HTMLDivElement>, "children" | "class"> {
	/** The metric value */
	value?: string | number;
	/** Label above the value */
	label?: string;
	/** Unit suffix (%, ms, GB, etc.) */
	unit?: string;
	/** Size variant */
	size?: StatSize;
	/** Accent color for value text + glow */
	accent?:
		| "teal"
		| "purple"
		| "magenta"
		| "ember"
		| "frost"
		| "cyber"
		| "electric"
		| "azure"
		| "gold";
	/** Enable glow on the value text */
	glow?: boolean;
	/** Visual preset */
	preset?: string;
	/** Custom children override */
	children?: Snippet;
}
