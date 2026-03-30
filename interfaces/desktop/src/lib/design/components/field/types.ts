/**
 * @file Field Types
 * @kind field
 * @layer components
 */

import type { Snippet } from "svelte";
import type { FieldPrimitiveProps } from "$lib/design/primitives/field/index.js";

export type FieldPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface FieldProps extends FieldPrimitiveProps {
	/** Label text */
	label?: string;
	/** Description text */
	description?: string;
	/** Error message — shown when invalid */
	error?: string;
	/** Whether the field value is invalid */
	invalid?: boolean;
	/** Whether the field is required */
	required?: boolean;
	/** Whether the field is disabled */
	disabled?: boolean;
	/** Visual preset */
	preset?: FieldPreset;
	/** Content rendered inside the field (the control) */
	children?: Snippet;
}
