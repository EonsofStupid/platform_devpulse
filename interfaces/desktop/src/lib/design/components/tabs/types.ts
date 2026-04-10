/**
 * @file Tabs Component Types
 * @kind tabs
 * @layer components
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { TabsRootProps as TabsPrimitiveRootProps } from "$lib/design/behaviors/navigation/tabs/index.js";

export type TabsPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** Tabs root props — creates adapter and provides context */
export interface TabsProps extends TabsPrimitiveRootProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: TabsPreset;
}

/** TabsList props — container for tab triggers (role="tablist") */
export interface TabsListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}

/** TabsTrigger props — individual tab button (role="tab") */
export interface TabsTriggerProps extends Omit<HTMLButtonAttributes, "children"> {
	/** Tab value identifier — must match a TabsContent value */
	value: string;
	/** Whether this tab is disabled */
	disabled?: boolean;
	children?: Snippet;
	class?: string;
}

/** TabsContent props — tab panel (role="tabpanel") */
export interface TabsContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Tab value identifier — must match a TabsTrigger value */
	value: string;
	children?: Snippet;
	class?: string;
}
