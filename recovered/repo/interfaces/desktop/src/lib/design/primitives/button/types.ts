import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

/** HTML button type attribute */
export type ButtonType = "button" | "submit" | "reset";

/**
 * Structural props for the Button primitive.
 *
 * Extends native `<button>` attributes. Supports three interaction modes:
 * - **Standard**: click fires the native click event
 * - **Toggle**: `pressed` defined → tracks on/off via `aria-pressed`
 * - **Menu trigger**: `expanded` defined → tracks popup via `aria-expanded`
 *
 * @example
 * ```svelte
 * <button {...buttonAnatomy.attrs.root} {disabled}>
 *   {@render children?.()}
 * </button>
 * ```
 */
export interface ButtonPrimitiveProps extends Omit<HTMLButtonAttributes, "children"> {
	/** Snippet content rendered inside the button */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Button type attribute. Default: "button" */
	type?: ButtonType;
	/** Disabled state — prevents interaction, sets aria-disabled */
	disabled?: boolean;
	/** Loading state — shows loading indicator, sets aria-busy */
	loading?: boolean;
	/** Toggle mode — tracks pressed state via aria-pressed */
	pressed?: boolean;
	/** Callback when toggle state changes */
	onPressedChange?: (pressed: boolean) => void;
	/** Menu trigger mode — tracks expanded state via aria-expanded */
	expanded?: boolean;
}
