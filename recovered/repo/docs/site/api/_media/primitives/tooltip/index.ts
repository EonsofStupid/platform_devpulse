/**
 * @file primitives/tooltip/index.ts
 * @kind tooltip
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Tooltip primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { tooltipSlots, tooltipStateTokens, tooltipSlotStates } from "./types.js";
export type {
	TooltipTriggerProps,
	TooltipContentProps,
	TooltipArrowProps,
	TooltipSlot,
	TooltipState,
} from "./types.js";
