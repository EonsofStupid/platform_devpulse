/**
 * @file Tabs Component Types
 * @kind tabs
 * @layer components
 *
 * Prop types for all Tabs sub-components.
 * Root provides adapter via context; sub-components spread slot attrs.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

/** Tabs root props — creates adapter and provides context */
export interface TabsProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		ComponentProps {
	/** Currently active tab value */
	value?: string;
	/** Callback when active tab changes */
	onValueChange?: (value: string) => void;
	/** Tab orientation (default: "horizontal") */
	orientation?: "horizontal" | "vertical";
	/** Activate tab on focus (default: true) */
	activateOnFocus?: boolean;
	/** Loop keyboard navigation (default: true) */
	loop?: boolean;
	/** Content */
	children?: Snippet;
}

/** TabsList props — container for tab triggers (role="tablist") */
export interface TabsListProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
}

/** TabsTrigger props — individual tab button (role="tab") */
export interface TabsTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "disabled"> {
	/** Tab value identifier — must match a TabsContent value */
	value: string;
	/** Whether this tab is disabled */
	disabled?: boolean;
	/** Content */
	children?: Snippet;
}

/** TabsContent props — tab panel (role="tabpanel") */
export interface TabsContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	/** Tab value identifier — must match a TabsTrigger value */
	value: string;
	/** Content */
	children?: Snippet;
}
