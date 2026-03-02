/**
 * @file Link Preview Component Types
 * @kind link-preview
 * @layer components
 *
 * Compound component props for LinkPreview root + sub-components.
 * Tooltip-like hover preview for links.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLAnchorAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface LinkPreviewProps extends BaseProps, ColdLightProps {
	children?: Snippet;
	/** Delay in ms before the preview opens on hover. @default 700 */
	openDelay?: number;
	/** Delay in ms before the preview closes after leaving. @default 300 */
	closeDelay?: number;
	/** Controlled open state. */
	open?: boolean;
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
	/** CSS class for the root element. */
	class?: string;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface LinkPreviewTriggerProps extends Omit<HTMLAnchorAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface LinkPreviewContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
