/**
 * @file primitives/select/index.ts
 * @kind select
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Select primitive barrel export.
 * Contract lives HERE — with the implementation.
 * No .svelte files — melt-backed primitives get Svelte components later.
 */

export { contract } from "./contract.js";
export { selectSlots, selectStateTokens, selectSlotStates } from "./types.js";
export type {
	SelectTriggerProps,
	SelectContentProps,
	SelectOptionProps,
	SelectLabelProps,
	SelectSlot,
	SelectState,
} from "./types.js";
