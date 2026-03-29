import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

/**
 * Structural props for the Toggle primitive.
 *
 * A toggle is a button that maintains on/off state via `aria-pressed`.
 * Visual state is communicated via `data-state="on"|"off"`.
 *
 * @example
 * ```svelte
 * <button {...toggleAnatomy.attrs.root} aria-pressed={pressed}>
 *   {@render children?.()}
 * </button>
 * ```
 */
export interface TogglePrimitiveProps extends Omit<HTMLButtonAttributes, "children"> {
	/** Snippet content rendered inside the toggle */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether the toggle is currently pressed/on */
	pressed?: boolean;
	/** Callback when pressed state changes */
	onPressedChange?: (pressed: boolean) => void;
	/** Disabled state — prevents interaction */
	disabled?: boolean;
}
