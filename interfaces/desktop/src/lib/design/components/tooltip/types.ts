/**
 * @file Tooltip Component Types
 * @kind tooltip
 * @layer components
 *
 * Compound component props for Tooltip root + sub-components.
 * MeltUI transport adapter provides ARIA and positioning.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface TooltipProps extends BaseProps, ColdLightProps {
	children?: Snippet;
	/** Delay in ms before the tooltip opens on hover. @default 700 */
	openDelay?: number;
	/** Delay in ms before the tooltip closes after leaving. @default 300 */
	closeDelay?: number;
	/** Controlled open state. */
	open?: boolean;
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
	/** Whether to close the tooltip when pointer is pressed down. @default true */
	closeOnPointerDown?: boolean;
	/** Whether to disable hoverable content. @default false */
	disableHoverableContent?: boolean;
	/** Whether to force the tooltip visible. @default false */
	forceVisible?: boolean;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface TooltipTriggerProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface TooltipContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
