/**
 * @file Form Component Types
 * @kind form
 * @layer components
 *
 * Extends FormPrimitiveProps with visual preset and size.
 */

import type { FormPrimitiveProps } from "$lib/design/behaviors/inputs/form/index.js";

export type FormSize = "sm" | "md" | "lg";
export type FormPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** Form component props — extends primitive with preset + size */
export interface FormComponentProps extends Omit<FormPrimitiveProps, "onSubmit"> {
	/** Style preset */
	preset?: FormPreset;
	/** Size variant — propagates to child form fields via CSS */
	size?: FormSize;
	/** Accessible label for the form. */
	label?: string;
	/** Whether the form is in a pending/submitting state. @default false */
	pending?: boolean;
	/** Called on form submit. Receives the native SubmitEvent. */
	onSubmit?: (e: SubmitEvent) => void;
	/** Called on form reset. */
	onReset?: () => void;
}
