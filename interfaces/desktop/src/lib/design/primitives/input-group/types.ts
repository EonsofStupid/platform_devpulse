import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the InputGroup primitive.
 *
 * An input group wraps a form input with visual prefix/suffix addons.
 * For a complete field with label and error, wrap InputGroup inside Field.
 * For search-specific input with clear, use SearchField instead.
 *
 * @example
 * ```svelte
 * <div {...inputGroupAnatomy.attrs.root}>
 *   <div {...inputGroupAnatomy.attrs.prefix}>$</div>
 *   <input {...inputGroupAnatomy.attrs.input} type="number" />
 *   <div {...inputGroupAnatomy.attrs.suffix}>.00</div>
 * </div>
 * ```
 */
export interface InputGroupPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the input group */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Disabled state — propagates to input */
	disabled?: boolean;
	/** Invalid state — visual indicator */
	invalid?: boolean;
}
