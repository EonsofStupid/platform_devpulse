/**
 * @file NumberField Types
 * @kind number-field
 * @layer components
 */

import type { NumberFieldPrimitiveProps } from "$lib/design/behaviors/inputs/number-field/index.js";

export type NumberFieldSize = "sm" | "md" | "lg";
export type NumberFieldPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface NumberFieldProps extends NumberFieldPrimitiveProps {
	/** Current numeric value */
	value?: number;
	/** Callback when value changes */
	onValueChange?: (value: number) => void;
	/** Minimum allowed value */
	min?: number;
	/** Maximum allowed value */
	max?: number;
	/** Step increment. Default: 1 */
	step?: number;
	/** Disabled state */
	disabled?: boolean;
	/** Read-only state */
	readonly?: boolean;
	/** Required for form validation */
	required?: boolean;
	/** Human-readable value text */
	valueText?: string;
	/** Size — structural class */
	size?: NumberFieldSize;
	/** Visual preset */
	preset?: NumberFieldPreset;
	/** Accessible label */
	"aria-label"?: string;
	/** Accessible description reference */
	"aria-describedby"?: string;
}
