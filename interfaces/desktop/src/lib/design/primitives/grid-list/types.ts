import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Selection mode for grid list */
export type GridListSelectionMode = "none" | "single" | "multiple";

/**
 * Structural props for the GridList primitive.
 *
 * A grid list presents selectable items in a 2D grid with keyboard navigation
 * in both axes. For single-column lists, use Listbox instead. For tabular
 * data with headers, use Table instead.
 *
 * @example
 * ```svelte
 * <div {...gridListAnatomy.attrs.root} role="grid" aria-label="Photo gallery">
 *   <div {...gridListAnatomy.attrs.item} role="gridcell" aria-selected={selected}>
 *     Photo 1
 *   </div>
 *   <div {...gridListAnatomy.attrs.item} role="gridcell">
 *     Photo 2
 *   </div>
 * </div>
 * ```
 */
export interface GridListPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the grid list */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Selection mode. Default: "none" */
	selectionMode?: GridListSelectionMode;
	/** Currently selected item keys */
	selectedKeys?: Set<string>;
	/** Callback when selection changes */
	onSelectionChange?: (keys: Set<string>) => void;
	/** Disabled state — prevents all selection */
	disabled?: boolean;
}
