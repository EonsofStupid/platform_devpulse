<!--
	@component Calendar
	@kind calendar
	@layer component
	@category interactive
	@description Date grid allowing single date selection with month and year navigation
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/grid/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle calendar-default
	@styleIds calendar-default
	@requiredAxes backgroundColor, border, borderRadius, color, typography
	@slots root:all, header:none, grid:none, cell:none, nav:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { untrack } from "svelte";
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import { setCalendarContext } from "./context.js";
import type { CalendarRootProps } from "./types.js";

let {
	ids,
	value: controlledValue,
	defaultValue = null,
	onValueChange,
	focusedValue,
	defaultFocusedValue,
	onFocusChange,
	visibleMonths = 1,
	isDateUnavailable,
	isDisabled = false,
	isReadOnly = false,
	isInvalid = false,
	minValue,
	maxValue,
	firstDayOfWeek = "sun",
	autoFocus = false,
	locale = "en-US",
	dir = "ltr",
	children,
	preset = "default",
	class: className,
	...rest
}: CalendarRootProps = $props();

const headingId = untrack(
	() => ids?.heading ?? `cal-heading-${Math.random().toString(36).slice(2, 9)}`,
);
const today = new Date();
today.setHours(0, 0, 0, 0);

let internalValue = $state<Date | null | undefined>(untrack(() => defaultValue));
let currentMonth = $state(new Date());
let internalFocus = $state<Date | null>(untrack(() => defaultFocusedValue ?? null));

const selectedDate = $derived(controlledValue !== undefined ? controlledValue : internalValue);
const focusedDate = $derived(focusedValue !== undefined ? focusedValue : internalFocus);

function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

function isDateDisabledFn(date: Date): boolean {
	if (isDisabled) return true;
	if (minValue && date < minValue) return true;
	if (maxValue && date > maxValue) return true;
	if (isDateUnavailable?.(date)) return true;
	return false;
}

setCalendarContext({
	get currentMonth() {
		return currentMonth;
	},
	get selectedDate() {
		return selectedDate;
	},
	get focusedDate() {
		return focusedDate;
	},
	today,
	get minValue() {
		return minValue;
	},
	get maxValue() {
		return maxValue;
	},
	get isDisabled() {
		return isDisabled;
	},
	get isReadOnly() {
		return isReadOnly;
	},
	get isInvalid() {
		return isInvalid;
	},
	get locale() {
		return locale;
	},
	get dir() {
		return dir;
	},
	get ids() {
		return ids ?? {};
	},
	headingId,
	get isDateUnavailable() {
		return isDateUnavailable;
	},
	prevMonth() {
		const prev = new Date(currentMonth);
		prev.setMonth(prev.getMonth() - 1);
		currentMonth = prev;
	},
	nextMonth() {
		const next = new Date(currentMonth);
		next.setMonth(next.getMonth() + 1);
		currentMonth = next;
	},
	selectDate(date: Date) {
		if (isDisabled || isReadOnly || isDateDisabledFn(date)) return;
		internalValue = date;
		onValueChange?.({ value: date });
	},
	focusDate(date: Date) {
		internalFocus = date;
		onFocusChange?.({ date });
	},
	isDateDisabled: isDateDisabledFn,
	isOutsideMonth(date: Date) {
		return date.getMonth() !== currentMonth.getMonth();
	},
	isSelected(date: Date) {
		return selectedDate ? isSameDay(selectedDate, date) : false;
	},
	isToday(date: Date) {
		return isSameDay(today, date);
	},
});

const m = $derived(resolveMacro({ kind: "calendar", preset }));
</script>

<div
	id={ids?.root}
	role="group"
	aria-label="Calendar"
	aria-labelledby={headingId}
	{dir}
	{...m.dataAttrs}
	data-slot="root"
	data-state={isDisabled ? "disabled" : undefined}
	style={cssVarString(m.cssVars)}
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
