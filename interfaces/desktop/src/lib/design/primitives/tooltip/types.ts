import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Tooltip placement relative to trigger */
export type TooltipPlacement =
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
 * Structural props for the Tooltip primitive.
 *
 * A tooltip provides supplementary text that appears on hover/focus.
 * Content is TEXT ONLY — no interactive elements (buttons, links, inputs).
 * For interactive floating content, use Popover instead.
 *
 * The tooltip appears after a configurable delay on hover and immediately
 * on keyboard focus. Disappears on mouse leave, blur, or Escape.
 *
 * @example
 * ```svelte
 * <button {...tooltipAnatomy.attrs.trigger} aria-describedby={tooltipId}>
 *   Save
 * </button>
 * <div {...tooltipAnatomy.attrs.content} role="tooltip" id={tooltipId}>
 *   Save your changes (Ctrl+S)
 * </div>
 * ```
 */
export interface TooltipPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the tooltip (text only) */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether the tooltip is showing */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Delay before showing tooltip on hover (ms). Default: 700 */
	openDelay?: number;
	/** Delay before hiding tooltip on mouse leave (ms). Default: 300 */
	closeDelay?: number;
	/** Placement relative to trigger. Default: "top" */
	placement?: TooltipPlacement;
}
