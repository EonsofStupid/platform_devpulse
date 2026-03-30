/**
 * @file Link Preview Component Types
 * @kind link-preview
 * @layer components
 *
 * Tooltip-like hover preview for links.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes, HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

// =============================================================================
// ROOT PROPS
// =============================================================================

export type LinkPreviewPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface LinkPreviewProps extends UIBaseProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: LinkPreviewPreset;
	/** Delay in ms before the preview opens on hover. Default: 700 */
	openDelay?: number;
	/** Delay in ms before the preview closes after leaving. Default: 300 */
	closeDelay?: number;
	/** Controlled open state. */
	open?: boolean;
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface LinkPreviewTriggerProps extends Omit<HTMLAnchorAttributes, "children"> {
	children?: Snippet;
	class?: string;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface LinkPreviewContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}
