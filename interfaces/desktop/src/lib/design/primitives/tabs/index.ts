/**
 * @file primitives/tabs/index.ts
 * @module @devpulse/coldlight/primitives/tabs
 * @layer primitives
 *
 * Barrel export for Tabs primitive.
 *
 * @example
 * ```svelte
 * import { Tabs } from "$lib/design/primitives";
 *
 * <Tabs.Root bind:value>
 *   <Tabs.List>
 *     <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
 *     <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
 *   </Tabs.List>
 *   <Tabs.Content value="tab1">Content 1</Tabs.Content>
 *   <Tabs.Content value="tab2">Content 2</Tabs.Content>
 * </Tabs.Root>
 * ```
 *
 * @since 1.0.0
 */

// ============================================
// COMPONENTS
// ============================================

export { default as Root } from "./Root.svelte";
export { default as List } from "./List.svelte";
export { default as Trigger } from "./Trigger.svelte";
export { default as Content } from "./Content.svelte";

// ============================================
// TYPES
// ============================================

export type {
	TabsRootProps,
	TabsListProps,
	TabsTriggerProps,
	TabsContentProps,
	TabsState,
	TabsSlot,
	TabsOrientation,
	TabsActivationMode,
} from "./types.js";

export { TabsSlots } from "./types.js";
