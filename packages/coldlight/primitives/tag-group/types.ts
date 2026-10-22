import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Tag group selection mode */
export type TagGroupSelectionMode = "none" | "single" | "multiple";

/**
 * Structural props for the TagGroup primitive.
 *
 * A tag group displays a collection of removable/selectable tags (chips).
 * Used for multi-select displays, filter chips, and label collections.
 * Tags can be removed individually via the remove button or Delete/Backspace key.
 *
 * @example
 * ```svelte
 * <div {...tagGroupAnatomy.attrs.root} role="grid" aria-label="Selected filters">
 *   <label {...tagGroupAnatomy.attrs.label}>Filters</label>
 *   <div {...tagGroupAnatomy.attrs.tag} role="gridcell">
 *     JavaScript
 *     <button {...tagGroupAnatomy.attrs.remove} aria-label="Remove JavaScript">×</button>
 *   </div>
 * </div>
 * ```
 */
export interface TagGroupPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the tag group */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Selection mode. Default: "none" */
	selectionMode?: TagGroupSelectionMode;
	/** Callback when a tag is removed */
	onRemove?: (key: string) => void;
	/** Disabled state — prevents all interaction */
	disabled?: boolean;
}
