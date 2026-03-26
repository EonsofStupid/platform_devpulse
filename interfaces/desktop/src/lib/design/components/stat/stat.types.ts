/**
 * @file Stat Types
 * @kind stat
 * @render html
 * @category content
 */

import type { Snippet } from "svelte";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type StatSize = "sm" | "md" | "lg";

export interface StatProps extends ComponentProps {
	/** The metric value */
	value?: string | number;
	/** Label above the value */
	label?: string;
	/** Unit suffix (%, ms, GB, etc.) */
	unit?: string;
	/** Size variant */
	size?: StatSize;
	/** Accent color for value text + glow */
	accent?: "teal" | "purple" | "magenta" | "ember" | "frost" | "cyber";
	/** Enable glow on the value text */
	glow?: boolean;
	/** Visual intent */
	intent?: string;
	/** Custom children override */
	children?: Snippet;
}
