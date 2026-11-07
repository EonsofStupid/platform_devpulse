/**
 * @file primitives/nav-item/index.ts
 * @kind nav-item
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Nav-item primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as NavItemRoot } from "./NavItem.svelte";
export { contract } from "./contract.js";
export { navItemSlots, navItemStateTokens, navItemSlotStates } from "./types.js";
export type { NavItemProps, NavItemSlot, NavItemState } from "./types.js";
