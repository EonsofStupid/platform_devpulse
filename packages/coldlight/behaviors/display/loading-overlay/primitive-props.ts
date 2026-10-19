import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the LoadingOverlay primitive.
 *
 * A loading overlay covers its parent with a backdrop and spinner,
 * preventing interaction during loading. For inline loading indicators,
 * use Spinner. For skeleton placeholders, use Skeleton.
 *
 * @example
 * ```svelte
 * <div {...loadingOverlayAnatomy.attrs.root}>
 *   <div {...loadingOverlayAnatomy.attrs.spinner} role="status" aria-live="polite">
 *     <!-- spinner visual -->
 *   </div>
 *   <span {...loadingOverlayAnatomy.attrs.label}>Loading...</span>
 * </div>
 * ```
 */
export interface LoadingOverlayPrimitiveProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the overlay */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether the overlay is visible. Default: false */
	visible?: boolean;
	/** Accessible label for the loading state */
	label?: string;
}
