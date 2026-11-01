/**
 * @file primitives/collapsible/index.ts
 * @kind collapsible
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Collapsible primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { collapsibleSlots, collapsibleStateTokens, collapsibleSlotStates } from "./types.js";
export type {
	CollapsibleTriggerProps,
	CollapsibleContentProps,
	CollapsibleSlot,
	CollapsibleState,
} from "./types.js";
