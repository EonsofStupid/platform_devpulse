import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Tree selection mode */
export type TreeSelectionMode = "none" | "single" | "multiple";

/**
 * Structural props for the Tree primitive.
 *
 * A tree displays hierarchical data as an expandable/collapsible list.
 * Items can be nested to create multi-level hierarchies. For flat lists,
 * use Listbox. For tabular hierarchical data, use a table with row grouping.
 *
 * @example
 * ```svelte
 * <div {...treeAnatomy.attrs.root} role="tree" aria-label="Files">
 *   <div {...treeAnatomy.attrs.item} role="treeitem" aria-expanded={true}>
 *     src/
 *     <div {...treeAnatomy.attrs.group} role="group">
 *       <div {...treeAnatomy.attrs.item} role="treeitem">index.ts</div>
 *       <div {...treeAnatomy.attrs.item} role="treeitem">main.ts</div>
 *     </div>
 *   </div>
 * </div>
 * ```
 */
export interface TreePrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the tree */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Currently expanded item keys */
	expandedKeys?: Set<string>;
	/** Callback when expanded keys change */
	onExpandedChange?: (keys: Set<string>) => void;
	/** Currently selected item keys */
	selectedKeys?: Set<string>;
	/** Callback when selected keys change */
	onSelectionChange?: (keys: Set<string>) => void;
	/** Selection mode. Default: "none" */
	selectionMode?: TreeSelectionMode;
	/** Disabled state */
	disabled?: boolean;
}
