/**
 * @file TextField Types
 * @kind text-field
 */

import type { Snippet } from "svelte";
import type { TextFieldPrimitiveProps } from "$lib/design/behaviors/inputs/text-field/index.js";

export type TextFieldSize = "sm" | "md" | "lg";
export type TextFieldType = "text" | "email" | "password" | "url" | "tel";
export type TextFieldPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface TextFieldProps extends TextFieldPrimitiveProps {
	/** Label text — rendered above the input */
	label?: string;
	/** Description text — rendered below the input */
	description?: string;
	/** Error message — shown when invalid */
	error?: string;
	/** Current value — `$bindable` so callers can `bind:value` */
	value?: string;
	/** Callback on value change */
	onValueChange?: (value: string) => void;
	/** Input type. Default: "text" */
	type?: TextFieldType;
	/** Placeholder */
	placeholder?: string;
	/** Native `autocomplete` attribute forwarded to the inner input. */
	autocomplete?: string;
	/** Native `spellcheck` attribute forwarded to the inner input. */
	spellcheck?: boolean;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	invalid?: boolean;
	/** Size — structural class */
	size?: TextFieldSize;
	/** Visual preset — selects the style preset */
	preset?: TextFieldPreset;
	/** Leading content (icon, prefix) */
	leading?: Snippet;
	/** Trailing content (icon, button) */
	trailing?: Snippet;
}
