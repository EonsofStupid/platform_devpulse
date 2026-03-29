import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Breadcrumbs primitive.
 *
 * Breadcrumbs display a navigational trail showing the user's location
 * within a site hierarchy. The last item represents the current page.
 * Separators between items are decorative and hidden from screen readers.
 *
 * @example
 * ```svelte
 * <nav {...breadcrumbsAnatomy.attrs.root} aria-label="Breadcrumb">
 *   <ol {...breadcrumbsAnatomy.attrs.list}>
 *     <li {...breadcrumbsAnatomy.attrs.item}>
 *       <a {...breadcrumbsAnatomy.attrs.link} href="/home">Home</a>
 *       <span {...breadcrumbsAnatomy.attrs.separator} aria-hidden="true">/</span>
 *     </li>
 *     <li {...breadcrumbsAnatomy.attrs.item}>
 *       <span {...breadcrumbsAnatomy.attrs.link} aria-current="page">Settings</span>
 *     </li>
 *   </ol>
 * </nav>
 * ```
 */
export interface BreadcrumbsPrimitiveProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	/** Snippet content rendered inside the breadcrumbs */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Separator character or snippet between items. Default: "/" */
	separator?: string;
	/** Maximum number of visible items before collapsing middle items with ellipsis */
	maxItems?: number;
}
