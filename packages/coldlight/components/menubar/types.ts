/**
 * @file Menubar Component Types
 * @kind menubar
 * @layer components
 *
 * Prop types for all Menubar sub-components.
 * ColdLight-owned menubar behavior — types declare structural props only.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";

// =============================================================================
// SIZE
// =============================================================================

export type MenubarSize = "sm" | "md" | "lg";
export type MenubarPreset = "default" | "stark" | "glass" | "flat" | "matte";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface MenubarProps
	extends UIBaseProps,
		Omit<HTMLAttributes<HTMLDivElement>, "children" | "class"> {
	/** Style preset */
	preset?: MenubarPreset;
}

// =============================================================================
// MENU PROPS — each menu within the bar
// =============================================================================

export interface MenubarMenuProps {
	children?: Snippet;
	/** Controlled open state */
	open?: boolean;
	/** Called when open state changes */
	onOpenChange?: (open: boolean) => void;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface MenubarTriggerProps extends Omit<HTMLButtonAttributes, "children"> {
	children?: Snippet;
	class?: UIBaseProps["class"];
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface MenubarContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "class"> {
	children?: Snippet;
	class?: UIBaseProps["class"];
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
	extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "class"> {
	children?: Snippet;
	class?: UIBaseProps["class"];
	/** Whether the item is disabled */
	disabled?: boolean;
	/** Called when the item is selected */
	onSelect?: () => void;
}

// =============================================================================
// SEPARATOR PROPS
// =============================================================================

export interface MenubarSeparatorProps extends Omit<HTMLAttributes<HTMLDivElement>, "class"> {
	class?: UIBaseProps["class"];
}
