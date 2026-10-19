/**
 * @file behaviors/inputs/calendar/index.ts
 * @package @devpulse/coldlight
 * @layer behavior
 *
 * Canonical behavior hook for the calendar / date grid primitive.
 * Consumed by components/calendar/Calendar.svelte and its sub-slots
 * (header, grid, cell) through the Svelte context exported from
 * components/calendar/context.ts.
 */

export { calendarAnatomy } from "./calendar.anatomy.js";
export type * from "./calendar.types.js";
export { useCalendar } from "./use-calendar.svelte.js";
