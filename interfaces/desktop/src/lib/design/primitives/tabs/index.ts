/**
 * @file Tabs Primitive Barrel
 */

export { getTabsContext, setTabsContext, type TabsContext } from "./context.js";
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
