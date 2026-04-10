import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

/**
 * Structural props for the Checkbox primitive.
 *
 * A checkbox is a tri-state selection control (checked/unchecked/indeterminate).
 * Renders as a `<button>` with `role="checkbox"` for full visual control
 * over the indicator appearance.
 *
 * The label can be clicked to toggle the checkbox. If no visible label,
 * `aria-label` or `aria-labelledby` MUST be provided on root.
 *
 * @example
 * ```svelte
 * <button {...checkboxAnatomy.attrs.root} role="checkbox" aria-checked={checked}>
 *   <span {...checkboxAnatomy.attrs.indicator} aria-hidden="true">
 *     {#if checked}✓{:else if indeterminate}—{/if}
 *   </span>
 *   <span {...checkboxAnatomy.attrs.label}>Accept terms</span>
 * </button>
 * ```
 */
/** Props for the Checkbox .svelte component (includes slot snippets) */
export interface CheckboxRootProps extends Omit<HTMLButtonAttributes, "children"> {
	/** Snippet content rendered inside the checkbox root button */
	children?: Snippet;
	/** Snippet for the check/dash/empty indicator */
	indicator?: Snippet;
	/** Snippet for the visible label text */
	label?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether the checkbox is checked */
	checked?: boolean;
	/** Callback when checked state changes */
	onCheckedChange?: (checked: boolean) => void;
	/** Whether the checkbox is in indeterminate state */
	indeterminate?: boolean;
	/** Callback when indeterminate state changes */
	onIndeterminateChange?: (indeterminate: boolean) => void;
	/** Disabled state */
	disabled?: boolean;
	/** Required for form validation */
	required?: boolean;
}

export interface CheckboxPrimitiveProps extends Omit<HTMLButtonAttributes, "children"> {
	/** Snippet content rendered inside the checkbox */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether the checkbox is checked */
	checked?: boolean;
	/** Callback when checked state changes */
	onCheckedChange?: (checked: boolean) => void;
	/** Whether the checkbox is in indeterminate state (partial selection) */
	indeterminate?: boolean;
	/** Disabled state — prevents interaction */
	disabled?: boolean;
	/** Required for form validation */
	required?: boolean;
	/** Form field name for native form submission */
	name?: string;
	/** Form field value when checked */
	value?: string;
}
