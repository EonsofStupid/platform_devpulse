/**
 * @file Context Menu Component Types
 * @kind context-menu
 * @layer components
 *
 * Prop types for all ContextMenu sub-components.
 * Similar to DropdownMenu but triggered by right-click. useContextMenu provides the ARIA.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { ContextMenuSize, ContextMenuVariant } from "./context-menu.generated.js";

export type { ContextMenuSize, ContextMenuVariant } from "./context-menu.generated.js";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface ContextMenuProps {
	children?: Snippet;
	/** Controlled open state */
	open?: boolean;
	/** Called when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Accessible name for the menu */
	"aria-label"?: string;
}

// =============================================================================
// TRIGGER PROPS — right-click zone
// =============================================================================

export interface ContextMenuTriggerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface ContextMenuContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
	/** The menu's surface role, from context-menu.tokens.json. Default: "elevated" */
	variant?: ContextMenuVariant;
	/** Family for the menu. It renders at the page's end, outside any family scope around its trigger. */
	surface?: SurfaceFamily;
	/** Size variant */
	size?: ContextMenuSize;
}

// =============================================================================
// ITEM PROPS
// =============================================================================

export interface ContextMenuItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
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

export interface ContextMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {
	class?: string;
}

// =============================================================================
// GROUP PROPS
// =============================================================================

export interface ContextMenuGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
	/** Accessible name for the group */
	label?: string;
}

// =============================================================================
// LABEL PROPS
// =============================================================================

export interface ContextMenuLabelProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}
