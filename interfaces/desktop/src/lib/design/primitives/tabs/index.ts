/**
 * @file Tabs Primitive Barrel
 */
export { default as Tabs } from "./Tabs.svelte";
export { default as TabsList } from "./TabsList.svelte";
export { default as TabsTrigger } from "./TabsTrigger.svelte";
export { default as TabsContent } from "./TabsContent.svelte";

export type {
	TabsProps,
	TabsListProps,
	TabsTriggerProps,
	TabsContentProps,
} from "./types.js";

export { setTabsContext, getTabsContext, type TabsContext } from "./context.js";
