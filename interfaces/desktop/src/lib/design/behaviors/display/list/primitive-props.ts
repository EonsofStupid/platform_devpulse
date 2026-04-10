import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** List type — ordered or unordered */
export type ListType = "unordered" | "ordered";

/**
 * Structural props for the List primitive.
 *
 * A list renders items using semantic <ul>/<ol> + <li> markup.
 * For selectable lists with keyboard navigation, use Listbox.
 * For grid-based selection, use GridList.
 *
 * @example
 * ```svelte
 * <ul {...listAnatomy.attrs.root}>
 *   <li {...listAnatomy.attrs.item}>First item</li>
 *   <li {...listAnatomy.attrs.item}>Second item</li>
 * </ul>
 * ```
 */
export interface ListPrimitiveProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	/** Snippet content rendered inside the list */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** List type. Default: "unordered" */
	type?: ListType;
}
