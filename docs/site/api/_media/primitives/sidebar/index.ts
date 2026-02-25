/**
 * @file primitives/sidebar/index.ts
 * @kind sidebar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Sidebar primitive barrel export.
 */

export { default as Sidebar } from "./Sidebar.svelte";
export { contract } from "./contract.js";
export { sidebarSlots, sidebarStateTokens, sidebarSlotStates } from "./types.js";
export type { SidebarProps, SidebarSlot, SidebarState } from "./types.js";
