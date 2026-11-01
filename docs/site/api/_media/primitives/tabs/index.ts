/**
 * @file primitives/tabs/index.ts
 * @kind tabs
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Tabs primitive barrel export.
 * Contract lives HERE — with the implementation.
 * No .svelte files — melt-backed primitives get Svelte components later.
 */

export { contract } from "./contract.js";
export { tabsSlots, tabsStateTokens, tabsSlotStates } from "./types.js";
export type {
	TabsTriggerListProps,
	TabsTriggerProps,
	TabsContentProps,
	TabsSlot,
	TabsState,
} from "./types.js";
