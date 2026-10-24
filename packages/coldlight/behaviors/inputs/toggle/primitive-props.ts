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
	/** Whether the toggle is pressed, when the owner controls it; omit to let the toggle hold it */
	pressed?: boolean;
	/** Whether the toggle starts pressed, when it holds its state. Default: false */
	defaultPressed?: boolean;
	/** Called with every change the user asks for (controlled or not) */
	onPressedChange?: (pressed: boolean) => void;
	/** Disabled state — prevents interaction */
	disabled?: boolean;
}
