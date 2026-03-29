import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the TableOfContents primitive.
 *
 * A table of contents provides navigation to sections within a document.
 * Tracks the currently visible section and highlights the corresponding
 * link. For page-level navigation between routes, use nav/breadcrumbs.
 *
 * @example
 * ```svelte
 * <nav {...tableOfContentsAnatomy.attrs.root} aria-label="Table of contents">
 *   <ul {...tableOfContentsAnatomy.attrs.list}>
 *     <li {...tableOfContentsAnatomy.attrs.item} data-active={true}>
 *       <a {...tableOfContentsAnatomy.attrs.link} href="#intro" aria-current="true">Introduction</a>
 *     </li>
 *     <li {...tableOfContentsAnatomy.attrs.item}>
 *       <a {...tableOfContentsAnatomy.attrs.link} href="#setup">Setup</a>
 *     </li>
 *   </ul>
 * </nav>
 * ```
 */
export interface TableOfContentsPrimitiveProps
	extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	/** Snippet content rendered inside the table of contents */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Currently active section ID */
	activeId?: string;
	/** Callback when active section changes (via scroll observation) */
	onActiveChange?: (id: string) => void;
}
