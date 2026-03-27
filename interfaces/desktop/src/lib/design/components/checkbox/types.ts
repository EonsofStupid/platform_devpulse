/**
 * @file Checkbox Types
 * @kind checkbox
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type CheckboxPreset = "default";
export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "disabled">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	disabled?: boolean;
	checked?: boolean;
	indeterminate?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	preset?: CheckboxPreset;
	size?: CheckboxSize;
}
