/**
 * @file primitives/tree/index.ts
 * @kind tree
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Tree primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { treeSlots, treeStateTokens, treeSlotStates } from "./types.js";
export type { TreeRootProps, TreeItemProps, TreeSlot, TreeState } from "./types.js";
