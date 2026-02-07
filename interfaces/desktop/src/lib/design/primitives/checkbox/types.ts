/**
 * @file Checkbox Primitive Types
 * @description Structural type declarations for the checkbox primitive.
 * Aligned to taxonomy contract: kind="checkbox"
 * Slots: root, indicator
 * ariaStateProvider: "coldlight" — native <button> with role="checkbox" + aria-checked at component layer.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Checkbox root — checkable button with tri-state support */
export interface CheckboxProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	/** Checked state (bindable) */
	checked?: boolean;
	/** Indeterminate state for parent/mixed checkboxes */
	indeterminate?: boolean;
	children?: Snippet;
}

/** Checkbox indicator — visual check/indeterminate mark */
export interface CheckboxIndicatorProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}
