/**
 * @file Form Field Component Types
 * @kind form-field
 * @layer components
 *
 * Extends FormFieldPrimitiveProps with visual preset and size.
 */

import type { FormFieldPrimitiveProps } from "$lib/design/behaviors/inputs/form-field/index.js";

export type FormFieldSize = "sm" | "md" | "lg";
export type FormFieldPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** FormField component props — extends primitive with preset + size */
export interface FormFieldComponentProps extends FormFieldPrimitiveProps {
	/** Style preset */
	preset?: FormFieldPreset;
	/** Label text */
	label?: string;
	/** Description / help text */
	description?: string;
	/** Size variant */
	size?: FormFieldSize;
}
