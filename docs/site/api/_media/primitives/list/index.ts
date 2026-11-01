/**
 * @file primitives/list/index.ts
 * @kind list
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * List primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as List } from "./List.svelte";
export { default as ListItem } from "./ListItem.svelte";
export { contract } from "./contract.js";
export { listSlots, listStateTokens, listSlotStates } from "./types.js";
export type { ListProps, ListItemProps, ListSlot, ListState } from "./types.js";
