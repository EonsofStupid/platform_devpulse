/**
 * @file Tooltip Component Types
 * @kind tooltip
 * @layer components
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { TooltipPrimitiveProps } from "$lib/design/behaviors/overlays/tooltip/index.js";

export type TooltipPreset = "default" | "stark" | "glass" | "flat" | "matte";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface TooltipProps extends TooltipPrimitiveProps {
	/** Whether to close the tooltip when pointer is pressed down. Default: true */
	closeOnPointerDown?: boolean;
	/** Whether to disable hoverable content. Default: false */
	disableHoverableContent?: boolean;
	/** Whether to force the tooltip visible. Default: false */
	forceVisible?: boolean;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface TooltipTriggerProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
	children?: Snippet;
	class?: string;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface TooltipContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: TooltipPreset;
}
