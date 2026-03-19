/**
 * @file Popover Component Types
 * @kind popover
 * @layer components
 *
 * Compound component props for Popover root + sub-components.
 * MeltUI transport adapter provides ARIA and positioning.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/popover/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface PopoverProps extends BaseProps, ColdLightProps {
	children?: Snippet;
	/** Controlled open state. */
	open?: boolean;
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
	/** If the popover visibility should be controlled by the user. @default false */
	forceVisible?: boolean;
	/** If the popover should have the same width as the trigger. @default false */
	sameWidth?: boolean;
	/** Close on Escape key. @default true */
	closeOnEscape?: boolean;
	/** Close on outside click. @default true */
	closeOnOutsideClick?: boolean;
	/** CSS class for the root element. */
	class?: string;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface PopoverTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface PopoverContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// ARROW PROPS
// =============================================================================

export interface PopoverArrowProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {}
