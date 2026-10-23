/**
 * @file Textarea Types
 * @kind textarea
 * @layer components
 */

import type { TextareaPrimitiveProps } from "#coldlight/behaviors/inputs/textarea/index.js";

export type TextareaSize = "sm" | "md" | "lg";

export type TextareaPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface TextareaProps extends TextareaPrimitiveProps {
	/** Label text, rendered above the textarea and naming it */
	label?: string;
	/** Description text, rendered below and describing it */
	description?: string;
	/** Error message, shown while invalid */
	error?: string;
	/** Style preset. Default: "default". */
	preset?: TextareaPreset;
	size?: TextareaSize;
}
