import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the DropdownMenu primitive: a menu with a disclosure trigger.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */
export interface DropdownMenuPrimitiveProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content: the trigger and the content */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether the menu is open */
	open?: boolean;
	/** Called when the open state changes */
	onOpenChange?: (open: boolean) => void;
}
