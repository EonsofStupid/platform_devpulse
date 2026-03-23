/**
 * @file Stat Types
 * @kind stat
 */

import type { Snippet } from "svelte";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type StatSize = "sm" | "md" | "lg";

export interface StatProps extends ComponentProps {
	/** The metric value */
	value?: string | number;
	/** Label above or below the value */
	label?: string;
	/** Unit suffix (%, ms, GB, etc.) */
	unit?: string;
	/** Size variant */
	size?: StatSize;
	/** Accent color for glow */
	accent?: "teal" | "purple" | "ember" | "cyber";
	/** Custom children override */
	children?: Snippet;
}
