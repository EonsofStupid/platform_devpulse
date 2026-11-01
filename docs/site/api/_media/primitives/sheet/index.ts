/**
 * @file primitives/sheet/index.ts
 * @kind sheet
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Sheet primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { contract } from "./contract.js";
export { sheetSlots, sheetStateTokens, sheetSlotStates } from "./types.js";
export type { SheetTriggerProps, SheetContentProps, SheetSlot, SheetState } from "./types.js";
