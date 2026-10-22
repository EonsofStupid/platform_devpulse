import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Menu primitive.
 *
 * A menu presents a popup list of actions triggered from a button.
 * Items execute commands when activated. For value selection, use Listbox
 * or Select instead. For navigation, use a nav element with links.
 *
 * @example
 * ```svelte
 * <div {...menuAnatomy.attrs.root}>
 *   <button {...menuAnatomy.attrs.trigger} aria-haspopup="menu" aria-expanded={open}>
 *     Actions
 *   </button>
 *   <div {...menuAnatomy.attrs.content} role="menu">
 *     <div {...menuAnatomy.attrs.item} role="menuitem">Rename</div>
 *     <div {...menuAnatomy.attrs.separator} role="separator" />
 *     <div {...menuAnatomy.attrs.item} role="menuitem">Delete</div>
 *   </div>
 * </div>
 * ```
 */
export interface MenuPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the menu */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether the menu is open */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
}
