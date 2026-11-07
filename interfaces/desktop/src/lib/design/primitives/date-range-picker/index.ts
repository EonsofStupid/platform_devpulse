/**
 * @file primitives/date-range-picker/index.ts
 * @kind date-range-picker
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Date range picker primitive barrel export.
 * ariaStateProvider: "meltui" — no .svelte file, MeltUI adapter handles ARIA.
 */

export { contract } from "./contract.js";
export {
	dateRangePickerSlots,
	dateRangePickerStateTokens,
	dateRangePickerSlotStates,
} from "./types.js";
export type {
	DateRangePickerSlot,
	DateRangePickerState,
	DateRangePickerRootProps,
	DateRangePickerTriggerProps,
	DateRangePickerContentProps,
} from "./types.js";
