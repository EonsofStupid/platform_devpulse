import type { Snippet } from "svelte";
import type { HTMLTextareaAttributes } from "svelte/elements";

/** Textarea resize behavior */
export type TextareaResize = "none" | "vertical" | "horizontal" | "both" | "auto";

/**
 * Structural props for the Textarea primitive.
 *
 * A textarea provides multi-line text input. For single-line input,
 * use TextField. For rich text editing, use a dedicated editor component.
 * Supports auto-resize to fit content and character counting.
 *
 * @example
 * ```svelte
 * <div {...textareaAnatomy.attrs.root}>
 *   <label {...textareaAnatomy.attrs.label} for={textareaId}>Bio</label>
 *   <textarea {...textareaAnatomy.attrs.input} id={textareaId} rows={4}>{value}</textarea>
 *   <span {...textareaAnatomy.attrs.counter}>{value.length}/500</span>
 * </div>
 * ```
 */
/** The caller's attributes go on the textarea (the input part); the root container is the component's. */
export interface TextareaPrimitiveProps extends Omit<HTMLTextareaAttributes, "children" | "value"> {
	/** Snippet content rendered inside the textarea container */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** The value, when the owner controls it (bindable); omit to let the textarea hold it */
	value?: string;
	/** The starting value, when the textarea holds its state. Default: "" */
	defaultValue?: string;
	/** Called with every change the user makes (controlled or not) */
	onValueChange?: (value: string) => void;
	/** Number of visible text rows. Default: 3 */
	rows?: number;
	/** Maximum character count */
	maxLength?: number;
	/** Resize behavior. Default: "vertical" */
	resize?: TextareaResize;
	/** Auto-resize to fit content. Default: false */
	autoResize?: boolean;
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
	/** Form field name */
	name?: string;
}
