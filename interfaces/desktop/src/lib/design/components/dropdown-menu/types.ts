/**
 * @file Dropdown Menu Component Types
 * @kind dropdown-menu
 * @layer components
 *
 * Prop types for all DropdownMenu sub-components.
 * MeltUI spatialmenu transport adapter provides ARIA — types declare structural props only.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

// =============================================================================
// SIZE
// =============================================================================

export type DropdownMenuSize = "sm" | "md" | "lg";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface DropdownMenuProps extends BaseProps, ColdLightProps {
	children?: Snippet;
	/** Controlled open state */
	open?: boolean;
	/** Called when open state changes */
	onOpenChange?: (open: boolean) => void;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface DropdownMenuTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface DropdownMenuContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
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

export interface DropdownMenuItemProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Whether the item is disabled */
	disabled?: boolean;
	/** Called when the item is selected */
	onSelect?: () => void;
}

// =============================================================================
// SEPARATOR PROPS
// =============================================================================

export interface DropdownMenuSeparatorProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style">,
		BaseProps {}

// =============================================================================
// GROUP PROPS
// =============================================================================

export interface DropdownMenuGroupProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// LABEL PROPS
// =============================================================================

export interface DropdownMenuLabelProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
