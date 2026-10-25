/**
 * @file primitives/range-calendar/index.ts
 * @kind range-calendar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Range calendar primitive barrel export.
 * ariaStateProvider: "meltui" — no .svelte file, MeltUI adapter handles ARIA.
 */

export { contract } from "./contract.js";
export {
	rangeCalendarSlots,
	rangeCalendarStateTokens,
	rangeCalendarSlotStates,
} from "./types.js";
export type {
	RangeCalendarSlot,
	RangeCalendarState,
	RangeCalendarRootProps,
	RangeCalendarCellProps,
	RangeCalendarPrevButtonProps,
	RangeCalendarNextButtonProps,
} from "./types.js";
