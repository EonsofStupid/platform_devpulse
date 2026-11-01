/**
 * @file primitives/toaster/index.ts
 * @kind toaster
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toaster primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { toasterSlots, toasterStateTokens, toasterSlotStates } from "./types.js";
export type {
	ToasterRootProps,
	ToastContentProps,
	ToastCloseProps,
	ToasterSlot,
	ToasterState,
} from "./types.js";
