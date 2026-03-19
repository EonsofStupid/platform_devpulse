/**
 * @file Label Types
 * @kind label
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLLabelAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type LabelSize = "sm" | "md" | "lg";

export interface LabelProps
	extends Omit<HTMLLabelAttributes, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	htmlFor?: string;
	disabled?: boolean;
	required?: boolean;
	size?: LabelSize;
}
