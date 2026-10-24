import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Description list layout */
export type DescriptionListLayout = "vertical" | "horizontal" | "grid";

/**
 * Structural props for the DescriptionList primitive.
 *
 * A description list displays term/detail pairs using semantic HTML
 * (<dl>, <dt>, <dd>). For simple single key-value displays, a Row
 * with Text children may be simpler. Use DescriptionList when you have
 * multiple term-detail pairs or need semantic definition list markup.
 *
 * @example
 * ```svelte
 * <dl {...descriptionListAnatomy.attrs.root}>
 *   <dt {...descriptionListAnatomy.attrs.term}>Name</dt>
 *   <dd {...descriptionListAnatomy.attrs.detail}>Alice Johnson</dd>
 *   <dt {...descriptionListAnatomy.attrs.term}>Email</dt>
 *   <dd {...descriptionListAnatomy.attrs.detail}>alice@example.com</dd>
 * </dl>
 * ```
 */
export interface DescriptionListPrimitiveProps
	extends Omit<HTMLAttributes<HTMLDListElement>, "children"> {
	/** Snippet content rendered inside the description list */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Layout direction. Default: "vertical" */
	layout?: DescriptionListLayout;
}
