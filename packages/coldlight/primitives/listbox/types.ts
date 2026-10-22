import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Listbox selection mode */
export type ListboxSelectionMode = "single" | "multiple";

/**
 * Structural props for the Listbox primitive.
 *
 * A listbox presents a single-column list of selectable options. For a
 * list with text filtering, use Combobox. For action menus, use Menu.
 * For 2D grid selection, use GridList.
 *
 * @example
 * ```svelte
 * <div {...listboxAnatomy.attrs.root} role="listbox" aria-label="Fruits">
 *   <div {...listboxAnatomy.attrs.group} role="group" aria-labelledby={groupLabelId}>
 *     <div {...listboxAnatomy.attrs.label} id={groupLabelId}>Citrus</div>
 *     <div {...listboxAnatomy.attrs.option} role="option" aria-selected={selected}>Orange</div>
 *     <div {...listboxAnatomy.attrs.option} role="option">Lemon</div>
 *   </div>
 * </div>
 * ```
 */
export interface ListboxPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the listbox */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Selection mode. Default: "single" */
	selectionMode?: ListboxSelectionMode;
	/** Currently selected value(s) */
	value?: string | string[];
	/** Callback when selection changes */
	onChange?: (value: string | string[]) => void;
	/** Disabled state — prevents all selection */
	disabled?: boolean;
}
