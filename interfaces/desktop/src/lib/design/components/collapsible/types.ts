/**
 * @file Collapsible Component Types
 * @kind collapsible
 * @layer components
 *
 * Compound component props for Collapsible root + sub-components.
 * MeltUI transport adapter provides ARIA for trigger/content.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface CollapsibleProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Controlled open state. @default false */
	open?: boolean;
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
	/** Whether the collapsible is disabled. @default false */
	disabled?: boolean;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface CollapsibleTriggerProps
	extends Omit<HTMLAttributes<HTMLButtonElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface CollapsibleContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
