/**
 * @file Context Menu Component Types
 * @kind context-menu
 * @layer components
 *
 * Prop types for all ContextMenu sub-components.
 * Similar to DropdownMenu but triggered by right-click.
 * MeltUI spatialmenu transport adapter provides ARIA — types declare structural props only.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

// =============================================================================
// SIZE
// =============================================================================

export type ContextMenuSize = "sm" | "md" | "lg";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface ContextMenuProps extends BaseProps, ColdLightProps {
	children?: Snippet;
	/** Controlled open state */
	open?: boolean;
	/** Called when open state changes */
	onOpenChange?: (open: boolean) => void;
}

// =============================================================================
// TRIGGER PROPS — right-click zone
// =============================================================================

export interface ContextMenuTriggerProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface ContextMenuContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Size variant */
	size?: ContextMenuSize;
}

// =============================================================================
// ITEM PROPS
// =============================================================================

export interface ContextMenuItemProps
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

export interface ContextMenuSeparatorProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style">,
		BaseProps {}
