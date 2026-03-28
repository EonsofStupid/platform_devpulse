import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { UseTabsProps, UseTabsReturn } from "$lib/design/behaviors/tabs/tabs.types.js";

/** Context passed from TabsRoot to child slots. */
export interface TabsContext {
	readonly hook: UseTabsReturn;
}

/** Props for the Tabs root container. */
export interface TabsRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
		UseTabsProps {
	children?: Snippet;
	class?: string;
}

/** Props for the TabsList — tablist container. */
export interface TabsListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}

/** Props for a single TabsTrigger. */
export interface TabsTriggerProps extends Omit<HTMLButtonAttributes, "children"> {
	/** The value this tab activates. */
	value: string;
	disabled?: boolean;
	children?: Snippet;
	class?: string;
}

/** Props for a TabsContent panel. */
export interface TabsContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** The value this panel corresponds to. */
	value: string;
	children?: Snippet;
	class?: string;
}
