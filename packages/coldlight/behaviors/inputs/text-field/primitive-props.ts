import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { TextFieldType } from "./text-field.types.js";

/**
 * Structural props for the TextField primitive.
 *
 * A text field provides a text input with label, description, and error
 * message. For numeric input with steppers, use NumberField. For search
 * with clear button, use SearchField. For color values, use ColorField.
 *
 * @example
 * ```svelte
 * <div {...textFieldAnatomy.attrs.root}>
 *   <label {...textFieldAnatomy.attrs.label} for={inputId}>Email</label>
 *   <input {...textFieldAnatomy.attrs.input} id={inputId} type="email" value={email} />
 *   <div {...textFieldAnatomy.attrs.description}>We'll never share your email.</div>
 *   {#if error}
 *     <div {...textFieldAnatomy.attrs.error} role="alert" aria-live="polite">{error}</div>
 *   {/if}
 * </div>
 * ```
 */
export interface TextFieldPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the text field */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** The value, when the owner controls it (bindable); omit to let the field hold it */
	value?: string;
	/** The starting value, when the field holds its state. Default: "" */
	defaultValue?: string;
	/** Called with every change the user makes (controlled or not) */
	onValueChange?: (value: string) => void;
	/** Input type. Default: "text" */
	type?: TextFieldType;
	/** Whether the field is required */
	required?: boolean;
	/** Whether the current value is invalid */
	invalid?: boolean;
	/** Disabled state */
	disabled?: boolean;
	/** Read-only state */
	readonly?: boolean;
	/** Placeholder text */
	placeholder?: string;
	/** Whether to use textarea instead of input */
	multiline?: boolean;
	/** Error message */
	error?: string;
	/** Form field name */
	name?: string;
}
