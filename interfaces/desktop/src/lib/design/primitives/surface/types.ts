import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Valid semantic elements for Surface. */
export type SurfaceElement =
	| "div"
	| "section"
	| "article"
	| "aside"
	| "main"
	| "footer"
	| "header"
	| "nav";

/**
 * Structural props for the Surface primitive.
 *
 * A surface is a polymorphic container that renders as the appropriate
 * semantic HTML element. It's the foundation for cards, panels, widgets,
 * and content regions. When labeled, it becomes a navigable landmark.
 *
 * @example
 * ```svelte
 * <section {...surfaceAnatomy.attrs.root} aria-label="User profile">
 *   <!-- content -->
 * </section>
 * ```
 */
export interface SurfacePrimitiveProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	/** Semantic HTML element to render. Default: "div" */
	as?: SurfaceElement;
	/** Snippet content rendered inside the surface */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
}
