import type { HTMLAnchorAttributes } from "svelte/elements";

export interface UseNavItemProps {
	/** Whether this item represents the current page */
	active?: boolean;
	/** Whether the nav item is disabled */
	disabled?: boolean;
	/** The href for the navigation link */
	href?: string;
}

export type NavItemRootAttrs = HTMLAnchorAttributes & {
	"data-kind": "nav-item";
	"data-slot": "root";
	"data-state": "active" | "disabled" | "idle";
	"data-selected"?: "";
	"data-disabled"?: "";
};

export interface UseNavItemReturn {
	readonly root: NavItemRootAttrs;
}
