/**
 * @file ColorField Component Types
 * @kind color-field
 * @layer components
 *
 * Text input for editing color values — hex string or individual channel.
 * Form field with label, description, validation, error message.
 *
 * Spectrum-aligned: controlled/uncontrolled, channel/colorSpace,
 * validation (native/aria), label positioning, form integration.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { ColorChannel, ColorSpace, ColorValue } from "$lib/design/components/color-area/types.js";

// =============================================================================
// CALLBACK DETAILS
// =============================================================================

export interface ColorFieldChangeDetails {
	value: ColorValue | null;
}

export interface ColorFieldValidationResult {
	isInvalid: boolean;
	validationErrors: string[];
}

// =============================================================================
// IDS
// =============================================================================

export interface ColorFieldIds {
	root?: string;
	input?: string;
	label?: string;
	description?: string;
	errorMessage?: string;
}

// =============================================================================
// ROOT
// =============================================================================

export type ColorFieldPreset = "default" | "stark" | "glass" | "flat" | "matte";

export type ColorFieldSize = "sm" | "md" | "lg" | "xl";
export type ColorFieldLabelPosition = "top" | "side";
export type ColorFieldLabelAlign = "start" | "end";
export type ColorFieldValidationBehavior = "native" | "aria";
export type ColorFieldNecessityIndicator = "icon" | "label";

export interface ColorFieldRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir">,
		ComponentProps {
	ids?: Partial<ColorFieldIds>;
	/** Size variant. Default: "md". */
	size?: ColorFieldSize;
	/** Color channel to edit. If omitted, edits as hex. */
	channel?: ColorChannel;
	/** Color space when channel is provided. */
	colorSpace?: ColorSpace;
	/** Whether scroll changes the value. Default: false. */
	isWheelDisabled?: boolean;
	/** Controlled value. */
	value?: ColorValue | null;
	/** Initial value when uncontrolled. */
	defaultValue?: ColorValue | null;
	/** Callback when value changes. */
	onChange?: (details: ColorFieldChangeDetails) => void;
	/** Whether the field is disabled. */
	isDisabled?: boolean;
	/** Whether the field is read-only. */
	isReadOnly?: boolean;
	/** Whether the field is required. */
	isRequired?: boolean;
	/** Whether the current value is invalid. */
	isInvalid?: boolean;
	/** Validation function. */
	validate?: (value: ColorValue | null) => string | null | undefined;
	/** Validation behavior. Default: "native". */
	validationBehavior?: ColorFieldValidationBehavior;
	/** Placeholder text. */
	placeholder?: string;
	/** Whether to auto-focus on mount. */
	autoFocus?: boolean;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	/** Form element ID to associate with. */
	form?: string;
	/** Input name for form submission. */
	name?: string;
	/** Style preset. Default: "default". */
	preset?: ColorFieldPreset;
	children?: Snippet;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ColorFieldSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

/** Label for the color field. */
export interface ColorFieldLabelProps extends ColorFieldSlotProps {
	/** Label position relative to input. Default: "top". */
	position?: ColorFieldLabelPosition;
	/** Label horizontal alignment. Default: "start". */
	align?: ColorFieldLabelAlign;
	/** Necessity indicator style. Default: "icon". */
	necessityIndicator?: ColorFieldNecessityIndicator;
}

/** The text input element. */
export interface ColorFieldInputProps extends Omit<HTMLInputAttributes, "style" | "children" | "class"> {
	class?: string;
}

/** Description/hint text below the input. */
export interface ColorFieldDescriptionProps extends ColorFieldSlotProps {}

/** Error message displayed when invalid. */
export interface ColorFieldErrorMessageProps extends ColorFieldSlotProps {}
