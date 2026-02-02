/**
 * @file NavigationMenu Primitive Types
 * @description Structural type declarations for the navigation-menu primitive.
 * Aligned to taxonomy contract: kind="navigation-menu"
 * Slots: root, list, item, trigger, content, link, viewport
 * ariaStateProvider: "coldlight" — semantic HTML nav landmark with roving tabindex.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** NavigationMenu root — navigation landmark container */
export interface NavigationMenuProps extends OmitStyle<HTMLElement>, BaseProps {
	/** Currently active value (bindable) */
	value?: string;
	children?: Snippet;
}

/** NavigationMenu list — unordered list of navigation items */
export interface NavigationMenuListProps extends OmitStyle<HTMLUListElement>, BaseProps {
	children?: Snippet;
}

/** NavigationMenu item — list item wrapping a trigger+content or link */
export interface NavigationMenuItemProps extends OmitStyle<HTMLLIElement>, BaseProps {
	children?: Snippet;
}

/** NavigationMenu trigger — button that toggles sub-menu content */
export interface NavigationMenuTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** NavigationMenu content — disclosure panel for sub-menu items */
export interface NavigationMenuContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** NavigationMenu link — anchor element for direct navigation */
export interface NavigationMenuLinkProps extends OmitStyle<HTMLAnchorElement>, BaseProps {
	children?: Snippet;
}

/** NavigationMenu viewport — container for rendering active content */
export interface NavigationMenuViewportProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
