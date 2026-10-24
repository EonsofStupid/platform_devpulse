import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the FormField primitive.
 *
 * A form-field extends the field pattern with form-level validation
 * integration. Tracks touched/dirty state for showing validation at
 * the right time (e.g., only after blur). For standalone fields outside
 * a form context, use Field instead.
 *
 * @example
 * ```svelte
 * <div {...formFieldAnatomy.attrs.root}>
 *   <label {...formFieldAnatomy.attrs.label} for={controlId}>Username</label>
 *   <input {...formFieldAnatomy.attrs.control} id={controlId} />
 *   <div {...formFieldAnatomy.attrs.description}>Must be 3-20 characters.</div>
 *   {#if error}
 *     <div {...formFieldAnatomy.attrs.error} aria-live="assertive">{error}</div>
 *   {/if}
 * </div>
 * ```
 */
export interface FormFieldPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the form field */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Field name — used for form data binding and validation */
	name: string;
	/** Whether the field is required */
	required?: boolean;
	/** Whether the field is disabled */
	disabled?: boolean;
	/** Whether the current value is invalid */
	invalid?: boolean;
	/** Error message string */
	error?: string;
	/** Whether the field has been interacted with (blurred at least once) */
	touched?: boolean;
	/** Whether the field value differs from the initial value */
	dirty?: boolean;
}
