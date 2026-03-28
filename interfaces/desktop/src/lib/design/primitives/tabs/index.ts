/**
 * @file primitives/tabs — Tab interface with ARIA APG compliance.
 * @package @devpulse/coldlight
 *
 * Compound primitive: TabsRoot > TabsList > TabsTrigger + TabsContent
 */

export { default as TabsRoot } from "./Tabs.svelte";
export { default as TabsList } from "./TabsList.svelte";
export { default as TabsTrigger } from "./TabsTrigger.svelte";
export { default as TabsContent } from "./TabsContent.svelte";
export type {
	TabsContext,
	TabsContentProps,
	TabsListProps,
	TabsRootProps,
	TabsTriggerProps,
} from "./types.js";
export { tabsSpec } from "./tabs.spec.js";
