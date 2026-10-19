/**
 * @file Navigation Menu Component Types
 * @kind navigation-menu
 * @layer components
 *
 * Prop types for all NavigationMenu sub-components.
 * ColdLight-owned — native ARIA on semantic HTML elements.
 * No matching primitive — extends UIBaseProps.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes, HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";

// =============================================================================
// SIZE
// =============================================================================

export type NavigationMenuSize = "sm" | "md" | "lg";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface NavigationMenuProps
	extends Omit<HTMLAttributes<HTMLElement>, "children">,
		UIBaseProps {
	/** Accessible label for the navigation */
	"aria-label"?: string;
}

// =============================================================================
// ITEM PROPS
// =============================================================================

export interface NavigationMenuItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "children"> {
	children?: Snippet;
	/** Value identifier for this item */
	value?: string;
	/** Additional CSS classes */
	class?: string;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface NavigationMenuTriggerProps extends Omit<HTMLButtonAttributes, "children"> {
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface NavigationMenuContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	/** Size variant */
	size?: NavigationMenuSize;
	/** Additional CSS classes */
	class?: string;
}

// =============================================================================
// LINK PROPS
// =============================================================================

export interface NavigationMenuLinkProps extends Omit<HTMLAnchorAttributes, "children"> {
	children?: Snippet;
	/** Whether this link is currently active (matches current route) */
	active?: boolean;
	/** Additional CSS classes */
	class?: string;
}
