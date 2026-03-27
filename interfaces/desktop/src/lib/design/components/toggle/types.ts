/**
 * @file Toggle Types
 * @kind toggle
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type ToggleSize = "sm" | "md" | "lg";

export type TogglePreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface ToggleProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "disabled">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	pressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	disabled?: boolean;
	/** Style preset. Default: "default". */
	preset?: TogglePreset;
	size?: ToggleSize;
}
