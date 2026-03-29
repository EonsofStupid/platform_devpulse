import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Dialog primitive.
 *
 * A dialog is a modal overlay for focused interactions. When open, it traps
 * focus inside the content, locks body scroll, and dims background content.
 * Uses the native `<dialog>` element for built-in modal semantics.
 *
 * Focus management:
 * - On open: focus moves to first focusable element inside content
 * - Tab/Shift+Tab: cycles within content (trapped)
 * - On close: focus returns to trigger element
 * - Escape: closes dialog
 *
 * @example
 * ```svelte
 * <button {...dialogAnatomy.attrs.trigger} aria-expanded={open}>Open</button>
 * <div {...dialogAnatomy.attrs.overlay} />
 * <dialog {...dialogAnatomy.attrs.content} aria-modal="true" aria-labelledby={titleId}>
 *   <h2 {...dialogAnatomy.attrs.title} id={titleId}>Dialog Title</h2>
 *   <p {...dialogAnatomy.attrs.description}>Description text</p>
 *   <button {...dialogAnatomy.attrs.close} aria-label="Close">×</button>
 * </dialog>
 * ```
 */
export interface DialogPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the dialog */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether the dialog is open */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Close when Escape key is pressed. Default: true */
	closeOnEscape?: boolean;
	/** Close when clicking outside the content (on overlay). Default: true */
	closeOnOutsideClick?: boolean;
	/** Prevent body scroll when open. Default: true */
	preventScroll?: boolean;
}
