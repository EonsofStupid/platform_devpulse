/**
 * @file Collapsible Component Types
 * @kind collapsible
 * @layer components
 *
 * Disclosure pattern — one trigger toggles one content panel.
 * Compound: Root, Trigger, Content, Indicator.
 * Direct ARIA — aria-expanded, aria-controls, keyboard enter/space.
 *
 * Ark UI / Zag aligned API.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export interface CollapsibleOpenChangeDetails {
	open: boolean;
}

export interface CollapsibleIds {
	root?: string;
	trigger?: string;
	content?: string;
}

export interface CollapsibleRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir">,
		ComponentProps {
	ids?: Partial<CollapsibleIds>;
	/** Controlled open state. */
	open?: boolean;
	/** Initial open state when uncontrolled. Default: false. */
	defaultOpen?: boolean;
	/** Callback when open state changes. */
	onOpenChange?: (details: CollapsibleOpenChangeDetails) => void;
	/** Callback when exit animation completes. */
	onExitComplete?: () => void;
	/** Whether the collapsible is disabled. */
	disabled?: boolean;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	children?: Snippet;
}

interface CollapsibleSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

export interface CollapsibleTriggerProps extends CollapsibleSlotProps {}
export interface CollapsibleContentProps extends CollapsibleSlotProps {}
export interface CollapsibleIndicatorProps extends CollapsibleSlotProps {}
