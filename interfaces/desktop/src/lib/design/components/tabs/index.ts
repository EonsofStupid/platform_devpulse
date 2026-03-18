/**
 * @file Tabs Component Barrel
 * @kind tabs
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { getTabsContext, setTabsContext } from "./context.js";
export { contract as tabsComponentContract } from "./contract.js";
export { default as Tabs } from "./Tabs.svelte";
export { default as TabsContent } from "./TabsContent.svelte";
export { default as TabsList } from "./TabsList.svelte";
export { default as TabsTrigger } from "./TabsTrigger.svelte";

export type {
	TabsContentProps,
	TabsListProps,
	TabsProps,
	TabsTriggerProps,
} from "./types.js";
