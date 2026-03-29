import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Popover placement relative to trigger */
export type PopoverPlacement =
	| "top"
	| "top-start"
	| "top-end"
	| "bottom"
	| "bottom-start"
	| "bottom-end"
	| "left"
	| "left-start"
	| "left-end"
	| "right"
	| "right-start"
	| "right-end";

/**
 * Structural props for the Popover primitive.
 *
 * A popover is floating content anchored to a trigger element. Can be modal
 * (traps focus) or non-modal (focus flows naturally to page).
 *
 * Positioning is handled by floating UI logic, controlled by the `placement` prop.
 *
 * @example
 * ```svelte
 * <button {...popoverAnatomy.attrs.trigger} aria-expanded={open}>Settings</button>
 * <div {...popoverAnatomy.attrs.content} role="dialog">
 *   <div {...popoverAnatomy.attrs.arrow} aria-hidden="true" />
 *   <!-- popover content -->
 *   <button {...popoverAnatomy.attrs.close} aria-label="Close">×</button>
 * </div>
 * ```
 */
export interface PopoverPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the popover */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether the popover is open */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Placement relative to trigger. Default: "bottom" */
	placement?: PopoverPlacement;
	/** Whether popover traps focus (modal). Default: false */
	modal?: boolean;
	/** Close when Escape is pressed. Default: true */
	closeOnEscape?: boolean;
	/** Close when clicking outside. Default: true */
	closeOnOutsideClick?: boolean;
}
