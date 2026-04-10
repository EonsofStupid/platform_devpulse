import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Pagination primitive.
 *
 * Pagination provides navigation between pages of content. Includes
 * previous/next buttons and page number buttons. For infinite scroll
 * or virtual lists, use scroll-area with intersection observer instead.
 *
 * @example
 * ```svelte
 * <nav {...paginationAnatomy.attrs.root} aria-label="Pagination">
 *   <ul {...paginationAnatomy.attrs.list}>
 *     <li {...paginationAnatomy.attrs.item}>
 *       <button {...paginationAnatomy.attrs.previous} aria-label="Previous page">←</button>
 *     </li>
 *     <li {...paginationAnatomy.attrs.item}>
 *       <button {...paginationAnatomy.attrs.page} aria-current="page">1</button>
 *     </li>
 *     <li {...paginationAnatomy.attrs.item}>
 *       <button {...paginationAnatomy.attrs.page}>2</button>
 *     </li>
 *     <li {...paginationAnatomy.attrs.item}>
 *       <button {...paginationAnatomy.attrs.next} aria-label="Next page">→</button>
 *     </li>
 *   </ul>
 * </nav>
 * ```
 */
export interface PaginationPrimitiveProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	/** Snippet content rendered inside the pagination */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Current page (1-indexed) */
	page?: number;
	/** Total number of pages */
	totalPages?: number;
	/** Callback when page changes */
	onPageChange?: (page: number) => void;
	/** Number of sibling pages to show around current. Default: 1 */
	siblingCount?: number;
	/** Whether to show first/last page buttons. Default: false */
	showEdges?: boolean;
	/** Disabled state */
	disabled?: boolean;
}
