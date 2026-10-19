/**
 * @file Calendar Context
 * @kind calendar
 * @layer components
 *
 * Carries the UseCalendarReturn across the compound component so sub-slots
 * (header / grid / cell) pull every reactive value, attribute object, and
 * action from the same instance of the hook.
 */

import { getContext, setContext } from "svelte";
import type { UseCalendarReturn } from "#coldlight/behaviors/inputs/calendar/index.js";

const CALENDAR_CTX = Symbol("coldlight-calendar");

export type CalendarContext = UseCalendarReturn;

export function setCalendarContext(ctx: CalendarContext): void {
	setContext(CALENDAR_CTX, ctx);
}

export function getCalendarContext(): CalendarContext {
	return getContext<CalendarContext>(CALENDAR_CTX);
}
