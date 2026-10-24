import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

/**
 * Structural props for the Switch primitive.
 *
 * A switch is a binary on/off toggle with a sliding thumb visual.
 * Unlike checkbox, switch is strictly two-state (no indeterminate).
 * Uses `role="switch"` with `aria-checked` — NOT `aria-pressed`.
 *
 * @example
 * ```svelte
 * <button {...switchAnatomy.attrs.root} role="switch" aria-checked={checked}>
 *   <span {...switchAnatomy.attrs.thumb} aria-hidden="true" />
 *   <span {...switchAnatomy.attrs.label}>Dark mode</span>
 * </button>
 * ```
 */
export interface SwitchPrimitiveProps extends Omit<HTMLButtonAttributes, "children"> {
	/** Snippet content rendered inside the switch */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether the switch is on, when the owner controls it; omit to let the switch hold it */
	checked?: boolean;
	/** Whether the switch starts on, when the switch holds its state. Default: false */
	defaultChecked?: boolean;
	/** Called with every change the user asks for (controlled or not) */
	onCheckedChange?: (checked: boolean) => void;
	/** Disabled state — prevents interaction */
	disabled?: boolean;
	/** Required for form validation */
	required?: boolean;
	/** Form field name for native form submission */
	name?: string;
}
