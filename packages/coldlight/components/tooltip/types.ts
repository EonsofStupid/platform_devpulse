/**
 * @file Tooltip Component Types
 * @kind tooltip
 * @layer components
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { TooltipPrimitiveProps } from "#coldlight/behaviors/overlays/tooltip/index.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { TooltipVariant } from "./tooltip.generated.js";

export type { TooltipVariant } from "./tooltip.generated.js";

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
	/** Surface role, from tooltip.tokens.json; the family in scope supplies it. Default: "elevated" */
	variant?: TooltipVariant;
	/** Family for the bubble and what it holds; unset, it takes the family in scope. */
	surface?: SurfaceFamily;
}
