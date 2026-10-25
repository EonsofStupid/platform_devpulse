/**
 * @file primitives/popover/index.ts
 * @kind popover
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Popover primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { popoverSlots, popoverStateTokens, popoverSlotStates } from "./types.js";
export type {
	PopoverTriggerProps,
	PopoverContentProps,
	PopoverArrowProps,
	PopoverSlot,
	PopoverState,
} from "./types.js";
