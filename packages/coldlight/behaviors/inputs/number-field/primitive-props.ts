import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the NumberField primitive.
 *
 * A number field provides a numeric input with increment/decrement buttons.
 * Supports min/max bounds, step increments, and keyboard stepping. For
 * continuous value selection with a visual track, use Slider instead.
 *
 * @example
 * ```svelte
 * <div {...numberFieldAnatomy.attrs.root}>
 *   <input {...numberFieldAnatomy.attrs.input} role="spinbutton"
 *          aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} />
 *   <button {...numberFieldAnatomy.attrs.increment} aria-label="Increase">+</button>
 *   <button {...numberFieldAnatomy.attrs.decrement} aria-label="Decrease">−</button>
 * </div>
 * ```
 */
export interface NumberFieldPrimitiveProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the number field */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Current numeric value */
	value?: number;
	/** Callback when value changes */
	onChange?: (value: number) => void;
	/** Minimum allowed value */
	min?: number;
	/** Maximum allowed value */
	max?: number;
	/** Step increment. Default: 1 */
	step?: number;
	/** Disabled state */
	disabled?: boolean;
	/** Required for form validation */
	required?: boolean;
	/** Whether the current value is invalid */
	invalid?: boolean;
	/** Form field name */
	name?: string;
}
