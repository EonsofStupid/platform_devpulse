/**
 * @file primitives/toolbar/index.ts
 * @kind toolbar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toolbar primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as ToolbarRoot } from "./Toolbar.svelte";
export { contract } from "./contract.js";
export { toolbarSlots, toolbarStateTokens, toolbarSlotStates } from "./types.js";
export type { ToolbarProps, ToolbarSlot, ToolbarState } from "./types.js";
