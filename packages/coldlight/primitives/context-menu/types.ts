import type { Snippet } from "svelte";

/**
 * Structural props for the ContextMenu primitive: a menu opened by right-click
 * on a zone, at the pointer.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */
export interface ContextMenuPrimitiveProps {
	/** Snippet content: the trigger zone and the content */
	children?: Snippet;
	/** Whether the menu is open */
	open?: boolean;
	/** Called when the open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Accessible name for the menu */
	"aria-label"?: string;
}
