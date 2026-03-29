import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Radio group orientation for keyboard navigation */
export type RadioGroupOrientation = "vertical" | "horizontal";

/**
 * Structural props for the RadioGroup primitive.
 *
 * A radio group presents mutually exclusive options — exactly one can be
 * selected at a time. For multi-select, use Checkbox group instead.
 * Arrow keys move selection between options (Tab moves in/out of the group).
 *
 * @example
 * ```svelte
 * <div {...radioGroupAnatomy.attrs.root} role="radiogroup" aria-label="Plan">
 *   <label {...radioGroupAnatomy.attrs.label}>Select a plan</label>
 *   <button {...radioGroupAnatomy.attrs.radio} role="radio" aria-checked={value === "free"}>
 *     Free
 *   </button>
 *   <button {...radioGroupAnatomy.attrs.radio} role="radio" aria-checked={value === "pro"}>
 *     Pro
 *   </button>
 * </div>
 * ```
 */
export interface RadioGroupPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the radio group */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Currently selected value */
	value?: string;
	/** Callback when selected value changes */
	onChange?: (value: string) => void;
	/** Keyboard navigation direction. Default: "vertical" */
	orientation?: RadioGroupOrientation;
	/** Required for form validation */
	required?: boolean;
	/** Disabled state — prevents all radio interaction */
	disabled?: boolean;
	/** Form field name */
	name?: string;
}
