import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the EmptyState primitive.
 *
 * An empty state communicates that a section has no content and guides
 * the user toward an action. For loading placeholders, use Skeleton.
 * For error messages within forms, use Field's error slot.
 */
export interface EmptyStatePrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the empty state */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
}
