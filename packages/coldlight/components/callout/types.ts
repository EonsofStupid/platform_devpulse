/**
 * @file Callout Types
 * @kind callout
 * @layer components
 *
 * No matching primitive — extends UIBaseProps.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";

export type CalloutVariant = "info" | "success" | "warning" | "error" | "tip";

export type CalloutPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface CalloutProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
		UIBaseProps {
	children?: Snippet;
	/** Callout semantic variant */
	variant?: CalloutVariant;
	/** Style preset. Default: "default". */
	preset?: CalloutPreset;
}
