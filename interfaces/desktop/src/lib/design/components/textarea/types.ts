/**
 * @file Textarea Types
 * @kind textarea
 * @layer components
 */

import type { HTMLTextareaAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type TextareaSize = "sm" | "md" | "lg";

export type TextareaPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface TextareaProps
	extends Omit<HTMLTextareaAttributes, "style" | "disabled" | "readonly" | "required" | "rows">,
		BaseProps,
		ComponentProps {
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	invalid?: boolean;
	rows?: number;
	onValueChange?: (value: string) => void;
	/** Style preset. Default: "default". */
	preset?: TextareaPreset;
	size?: TextareaSize;
}
