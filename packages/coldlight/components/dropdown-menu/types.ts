/**
 * @file Dropdown Menu Component Types
 * @kind dropdown-menu
 * @layer components
 *
 * Prop types for all DropdownMenu sub-components. useMenu provides the ARIA.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { DropdownMenuSize, DropdownMenuVariant } from "./dropdown-menu.generated.js";

export type { DropdownMenuSize, DropdownMenuVariant } from "./dropdown-menu.generated.js";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface DropdownMenuProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
	/** Controlled open state */
	open?: boolean;
	/** Called when open state changes */
	onOpenChange?: (open: boolean) => void;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface DropdownMenuTriggerProps extends Omit<HTMLButtonAttributes, "children"> {
	children?: Snippet;
	class?: string;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface DropdownMenuContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
	/** The menu's surface role, from dropdown-menu.tokens.json. Default: "elevated" */
	variant?: DropdownMenuVariant;
	/** Family for the menu; unset, it takes the family in scope. */
	surface?: SurfaceFamily;
	/** Size variant */
	size?: DropdownMenuSize;
	/** Preferred side to render */
	side?: "top" | "right" | "bottom" | "left";
	/** Alignment along the side */
	align?: "start" | "center" | "end";
}

// =============================================================================
// ITEM PROPS
// =============================================================================

export interface DropdownMenuItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
	/** Whether the item is disabled */
	disabled?: boolean;
	/** Called when the item is selected */
	onSelect?: () => void;
}

// =============================================================================
// SEPARATOR PROPS
// =============================================================================

export interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {
	class?: string;
}

// =============================================================================
// GROUP PROPS
// =============================================================================

export interface DropdownMenuGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
	/** Accessible name for the group */
	label?: string;
}

// =============================================================================
// LABEL PROPS
// =============================================================================

export interface DropdownMenuLabelProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}
