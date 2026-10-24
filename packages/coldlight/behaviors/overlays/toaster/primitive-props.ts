import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Toast notification type for visual treatment */
export type ToastType = "info" | "success" | "warning" | "error";

/** Screen position for the toaster */
export type ToasterPosition =
	| "top-left"
	| "top-center"
	| "top-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right";

/**
 * Structural props for the Toaster primitive.
 *
 * A toaster manages a stack of temporary toast notifications.
 * Toasts auto-dismiss and can be manually closed. For persistent
 * notifications, use a notification-center instead.
 *
 * @example
 * ```svelte
 * <div {...toasterAnatomy.attrs.root} role="status" aria-live="polite" data-position="bottom-right">
 *   <div {...toasterAnatomy.attrs.toast} data-type="success">
 *     <div {...toasterAnatomy.attrs.title}>Saved</div>
 *     <div {...toasterAnatomy.attrs.description}>Changes saved successfully.</div>
 *     <button {...toasterAnatomy.attrs.close} aria-label="Dismiss">×</button>
 *   </div>
 * </div>
 * ```
 */
export interface ToasterPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the toaster */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Screen position. Default: "bottom-right" */
	position?: ToasterPosition;
	/** Auto-dismiss duration in ms. Default: 5000. Set 0 to disable. */
	duration?: number;
	/** Maximum number of visible toasts. Default: 3 */
	maxVisible?: number;
}
