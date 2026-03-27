/**
 * @file Menubar Component Types
 * @kind menubar
 * @layer components
 *
 * Prop types for all Menubar sub-components.
 * MeltUI spatialmenu transport adapter provides ARIA — types declare structural props only.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

// =============================================================================
// SIZE
// =============================================================================

export type MenubarSize = "sm" | "md" | "lg";
export type MenubarPreset = "default" | "stark" | "glass" | "flat" | "matte";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface MenubarProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Style preset preset */
	preset?: MenubarPreset;
}

// =============================================================================
// MENU PROPS — each menu within the bar
// =============================================================================

export interface MenubarMenuProps extends BaseProps {
	children?: Snippet;
	/** Controlled open state */
	open?: boolean;
	/** Called when open state changes */
	onOpenChange?: (open: boolean) => void;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface MenubarTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface MenubarContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Size variant */
	size?: MenubarSize;
	/** Preferred side */
	side?: "top" | "bottom";
	/** Alignment */
	align?: "start" | "center" | "end";
}

// =============================================================================
// ITEM PROPS
// =============================================================================

export interface MenubarItemProps
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

export interface MenubarSeparatorProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style">,
		BaseProps {}
