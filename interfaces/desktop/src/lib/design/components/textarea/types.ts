/**
 * @file Textarea Types
 * @kind textarea
 * @layer components
 */

import type { TextareaPrimitiveProps } from "$lib/design/primitives/textarea/index.js";

export type TextareaSize = "sm" | "md" | "lg";

export type TextareaPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface TextareaProps extends TextareaPrimitiveProps {
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
