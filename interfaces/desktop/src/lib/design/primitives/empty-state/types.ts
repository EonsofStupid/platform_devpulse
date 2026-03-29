import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the EmptyState primitive.
 *
 * An empty state communicates that a section has no content and guides
 * the user toward an action. For loading placeholders, use Skeleton.
 * For error messages within forms, use Field's error slot.
 *
 * @example
 * ```svelte
 * <div {...emptyStateAnatomy.attrs.root}>
 *   <div {...emptyStateAnatomy.attrs.icon} aria-hidden="true">📭</div>
 *   <h3 {...emptyStateAnatomy.attrs.title}>No messages</h3>
 *   <p {...emptyStateAnatomy.attrs.description}>You're all caught up!</p>
 *   <button {...emptyStateAnatomy.attrs.action}>Compose message</button>
 * </div>
 * ```
 */
export interface EmptyStatePrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the empty state */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
}
