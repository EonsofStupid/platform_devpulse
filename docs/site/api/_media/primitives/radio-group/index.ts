/**
 * @file primitives/radio-group/index.ts
 * @kind radio-group
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Radio group primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { radioGroupSlots, radioGroupStateTokens, radioGroupSlotStates } from "./types.js";
export type {
	RadioGroupRootProps,
	RadioGroupItemProps,
	RadioGroupSlot,
	RadioGroupState,
} from "./types.js";
