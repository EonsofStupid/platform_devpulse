/**
 * @file Tabs Component Barrel
 * @kind tabs
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as Tabs } from "./Tabs.svelte";
export { default as TabsList } from "./TabsList.svelte";
export { default as TabsTrigger } from "./TabsTrigger.svelte";
export { default as TabsContent } from "./TabsContent.svelte";

export { contract as tabsComponentContract } from "./contract.js";
export { setTabsContext, getTabsContext } from "./context.js";

export type {
	TabsProps,
	TabsListProps,
	TabsTriggerProps,
	TabsContentProps,
} from "./types.js";
