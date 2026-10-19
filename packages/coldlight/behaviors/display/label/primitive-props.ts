import type { Snippet } from "svelte";
import type { HTMLLabelAttributes } from "svelte/elements";

/**
 * Structural props for the Label primitive.
 *
 * A label provides an accessible name for a form control. The `htmlFor`
 * prop creates a programmatic association — clicking the label focuses
 * or activates the associated control.
 *
 * @example
 * ```svelte
 * <label {...labelAnatomy.attrs.root} for={controlId}>
 *   Email address
 * </label>
 * ```
 */
export interface LabelPrimitiveProps extends Omit<HTMLLabelAttributes, "children"> {
	/** Snippet content rendered inside the label */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** ID of the associated form control */
	htmlFor?: string;
	/** Disabled state — visually muted when associated control is disabled */
	disabled?: boolean;
}
