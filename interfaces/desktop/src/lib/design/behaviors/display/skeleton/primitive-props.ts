import type { HTMLAttributes } from "svelte/elements";

/** Skeleton shape variants */
export type SkeletonShape = "rectangle" | "circle" | "text";

/**
 * Structural props for the Skeleton primitive.
 *
 * A skeleton shows a loading placeholder that mimics content shape.
 * For spinning indicators, use Spinner. For progress bars, use Progress.
 * Skeletons are always aria-hidden — loading state is communicated
 * by the parent container's live region.
 *
 * @example
 * ```svelte
 * <div {...skeletonAnatomy.attrs.root} aria-hidden="true"
 *      style="width: 200px; height: 20px;" />
 * ```
 */
export interface SkeletonPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Additional CSS classes */
	class?: string;
	/** Skeleton shape. Default: "rectangle" */
	shape?: SkeletonShape;
	/** Width (CSS value). Default: "100%" */
	width?: string;
	/** Height (CSS value). Default: "1rem" */
	height?: string;
	/** Border radius (CSS value). Overrides shape default. */
	radius?: string;
	/** Whether to animate with shimmer. Default: true */
	animate?: boolean;
}
