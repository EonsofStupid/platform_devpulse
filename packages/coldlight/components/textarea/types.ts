/**
 * @file Textarea Types
 * @kind textarea
 * @layer components
 */

import type { TextareaPrimitiveProps } from "#coldlight/behaviors/inputs/textarea/index.js";

export type TextareaSize = "sm" | "md" | "lg";

export type TextareaPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface TextareaProps extends TextareaPrimitiveProps {
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	invalid?: boolean;
	rows?: number;
	/** Current value — `$bindable` so callers can `bind:value`. */
	value?: string;
	onValueChange?: (value: string) => void;
	/** Style preset. Default: "default". */
	preset?: TextareaPreset;
	size?: TextareaSize;
}
