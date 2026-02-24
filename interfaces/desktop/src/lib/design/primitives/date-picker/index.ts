/**
 * @file primitives/date-picker/index.ts
 * @kind date-picker
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Date picker primitive barrel export.
 * ariaStateProvider: "meltui" — no .svelte file, MeltUI adapter handles ARIA.
 */

export { contract } from "./contract.js";
export { datePickerSlots, datePickerStateTokens, datePickerSlotStates } from "./types.js";
export type {
	DatePickerSlot,
	DatePickerState,
	DatePickerRootProps,
	DatePickerFieldProps,
	DatePickerTriggerProps,
	DatePickerContentProps,
} from "./types.js";
