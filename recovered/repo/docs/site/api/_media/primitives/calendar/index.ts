/**
 * @file primitives/calendar/index.ts
 * @kind calendar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Calendar primitive barrel export.
 * ariaStateProvider: "meltui" — no .svelte file, MeltUI adapter handles ARIA.
 */

export { contract } from "./contract.js";
export { calendarSlots, calendarStateTokens, calendarSlotStates } from "./types.js";
export type {
	CalendarSlot,
	CalendarState,
	CalendarRootProps,
	CalendarCellProps,
	CalendarPrevButtonProps,
	CalendarNextButtonProps,
} from "./types.js";
