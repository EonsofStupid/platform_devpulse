/**
 * @file Input Types
 * @kind input
 * @layer components
 */

import type { HTMLInputAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps
	extends Omit<
			HTMLInputAttributes,
			"style" | "size" | "disabled" | "readonly" | "required" | "type"
		>,
		BaseProps,
		Omit<ColdLightProps, "size"> {
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	type?: string;
	invalid?: boolean;
	onValueChange?: (value: string) => void;
	size?: InputSize;
}
