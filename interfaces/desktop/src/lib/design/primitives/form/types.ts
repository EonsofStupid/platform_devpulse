import type { Snippet } from "svelte";
import type { HTMLFormAttributes } from "svelte/elements";

/**
 * Structural props for the Form primitive.
 *
 * A form groups related fields, manages validation state, and handles
 * submission. Uses the native `<form>` element. For individual field
 * containers (label + input + error), use Field or FormField instead.
 *
 * @example
 * ```svelte
 * <form {...formAnatomy.attrs.root} onsubmit={handleSubmit}>
 *   <!-- Field primitives here -->
 *   <div {...formAnatomy.attrs.actions}>
 *     <button type="submit">Save</button>
 *     <button type="reset">Reset</button>
 *   </div>
 * </form>
 * ```
 */
export interface FormPrimitiveProps extends Omit<HTMLFormAttributes, "children"> {
	/** Snippet content rendered inside the form */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Callback on form submission (after validation passes) */
	onSubmit?: (data: FormData) => void;
	/** Callback on validation failure */
	onInvalid?: () => void;
	/** Whether the form is currently submitting */
	submitting?: boolean;
	/** Disable all fields within the form */
	disabled?: boolean;
}
