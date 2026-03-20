/**
 * @file TextField Component Types
 * @kind text-field
 */

import type { Snippet } from "svelte";
import type { HTMLInputAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

// Re-export hook types
export type { TextFieldType, UseTextFieldProps, UseTextFieldReturn } from "$lib/design/primitives/text-field/text-field.types.js";

export type TextFieldSize = "sm" | "md" | "lg";

export interface TextFieldProps
	extends Omit<HTMLInputAttributes, "style" | "children" | "value">,
		Omit<ColdLightProps, "size"> {
	class?: string;
	/** Label text — rendered above the input. */
	label?: string;
	/** Description text — rendered below the input. */
	description?: string;
	/** Error message — shown when invalid. */
	error?: string;
	/** Current value. */
	value?: string;
	/** Callback on value change. */
	onValueChange?: (value: string) => void;
	/** Input type. Default: "text". */
	type?: "text" | "email" | "password" | "url" | "tel";
	/** Placeholder. */
	placeholder?: string;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	invalid?: boolean;
	/** Size. Default: "md". */
	size?: TextFieldSize;
	/** Leading content (icon, prefix). */
	leading?: Snippet;
	/** Trailing content (icon, button). */
	trailing?: Snippet;
}
