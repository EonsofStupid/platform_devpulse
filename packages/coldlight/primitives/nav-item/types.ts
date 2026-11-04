import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes } from "svelte/elements";

/**
 * Structural props for the NavItem primitive: one link in a navigation list.
 */
export interface NavItemPrimitiveProps extends Omit<HTMLAnchorAttributes, "children"> {
	/** Snippet content rendered inside the item */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether this item represents the current page */
	active?: boolean;
	/** Whether the nav item is disabled */
	disabled?: boolean;
}
