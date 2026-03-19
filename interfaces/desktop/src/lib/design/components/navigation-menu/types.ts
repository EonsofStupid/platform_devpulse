/**
 * @file Navigation Menu Component Types
 * @kind navigation-menu
 * @layer components
 *
 * Prop types for all NavigationMenu sub-components.
 * ColdLight-owned — no MeltUI adapter. Native ARIA on semantic HTML elements.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes, HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

// =============================================================================
// SIZE
// =============================================================================

export type NavigationMenuSize = "sm" | "md" | "lg";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface NavigationMenuProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Accessible label for the navigation */
	"aria-label"?: string;
}

// =============================================================================
// ITEM PROPS
// =============================================================================

export interface NavigationMenuItemProps
	extends Omit<HTMLAttributes<HTMLLIElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Value identifier for this item */
	value?: string;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface NavigationMenuTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface NavigationMenuContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Size variant */
	size?: NavigationMenuSize;
}

// =============================================================================
// LINK PROPS
// =============================================================================

export interface NavigationMenuLinkProps
	extends Omit<HTMLAnchorAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Whether this link is currently active (matches current route) */
	active?: boolean;
}
