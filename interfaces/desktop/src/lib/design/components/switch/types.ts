/**
 * @file Switch Types
 * @kind switch
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type SwitchSize = "sm" | "md" | "lg";

export type SwitchIntent = "default" | "stark" | "glass" | "flat" | "matte";

export interface SwitchProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "disabled">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	disabled?: boolean;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	/** Style intent. Default: "default". */
	intent?: SwitchIntent;
	size?: SwitchSize;
}
