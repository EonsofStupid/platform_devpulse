/**
 * @file primitives/toggle-group/index.ts
 * @kind toggle-group
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toggle-group primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { contract } from "./contract.js";
export { toggleGroupSlots, toggleGroupStateTokens, toggleGroupSlotStates } from "./types.js";
export type {
	ToggleGroupRootProps,
	ToggleGroupItemProps,
	ToggleGroupSlot,
	ToggleGroupState,
} from "./types.js";
