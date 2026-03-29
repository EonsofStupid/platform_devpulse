import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Sidebar collapsed state */
export type SidebarState = "expanded" | "collapsed" | "hidden";

/** Sidebar collapsible mode */
export type SidebarCollapsible = "icon" | "offcanvas" | "none";

/**
 * Structural props for the Sidebar primitive.
 *
 * A sidebar provides persistent or collapsible side navigation.
 * For temporary sliding panels, use Sheet instead. For a navigation
 * bar without collapse behavior, use a simple nav landmark.
 *
 * @example
 * ```svelte
 * <nav {...sidebarAnatomy.attrs.root} aria-label="Main navigation" data-state={state}>
 *   <div {...sidebarAnatomy.attrs.header}>Logo</div>
 *   <div {...sidebarAnatomy.attrs.content}>
 *     <!-- nav items -->
 *   </div>
 *   <div {...sidebarAnatomy.attrs.footer}>
 *     <button {...sidebarAnatomy.attrs.toggle} aria-label="Collapse sidebar">◀</button>
 *   </div>
 * </nav>
 * ```
 */
export interface SidebarPrimitiveProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	/** Snippet content rendered inside the sidebar */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Current sidebar state. Default: "expanded" */
	state?: SidebarState;
	/** Callback when state changes */
	onStateChange?: (state: SidebarState) => void;
	/** Collapse behavior. Default: "icon" */
	collapsible?: SidebarCollapsible;
}
