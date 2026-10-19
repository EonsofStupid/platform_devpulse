/**
 * @file ContextualHelp Component Types
 * @kind contextual-help
 * @layer components
 *
 * No matching primitive — extends UIBaseProps.
 * Popover triggered by a help/info icon button.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";

export type ContextualHelpPreset = "default" | "stark" | "glass" | "flat" | "matte";
export type ContextualHelpVariant = "info" | "help";
export type ContextualHelpSize = "xs" | "sm";
export type ContextualHelpPlacement =
	| "top"
	| "top start"
	| "top end"
	| "bottom"
	| "bottom start"
	| "bottom end"
	| "left"
	| "left start"
	| "left end"
	| "right"
	| "right start"
	| "right end";

export interface ContextualHelpIds {
	root?: string;
	trigger?: string;
	popover?: string;
	heading?: string;
}

export interface ContextualHelpOpenChangeDetails {
	open: boolean;
}

export interface ContextualHelpRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "class" | "dir">,
		UIBaseProps {
	ids?: Partial<ContextualHelpIds>;
	/** Style preset. Default: "default". */
	preset?: ContextualHelpPreset;
	/** Info icon or help question mark. Default: "help". */
	variant?: ContextualHelpVariant;
	/** Size of the trigger button. Default: "xs". */
	size?: ContextualHelpSize;
	/** Controlled open state. */
	isOpen?: boolean;
	/** Initial open state (uncontrolled). */
	defaultOpen?: boolean;
	/** Callback when open state changes. */
	onOpenChange?: (details: ContextualHelpOpenChangeDetails) => void;
	/** Popover placement relative to trigger. Default: "bottom start". */
	placement?: ContextualHelpPlacement;
	/** Whether to flip when insufficient room. Default: true. */
	shouldFlip?: boolean;
	/** Offset along main axis. Default: 8. */
	offset?: number;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	/** Popover content. */
	children?: Snippet;
}

interface ContextualHelpSlotProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "class"> {
	children?: Snippet;
	class?: string;
}

export interface ContextualHelpHeadingProps extends ContextualHelpSlotProps {}
export interface ContextualHelpContentProps extends ContextualHelpSlotProps {}
export interface ContextualHelpFooterProps extends ContextualHelpSlotProps {}
