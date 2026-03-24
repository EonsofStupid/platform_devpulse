<!--
	@component RangeCalendar
	@kind range-calendar
	@layer components

	ColdLight RangeCalendar root — manages start/end date range state.
	Compound component: sub-components consume context to render slots.

	ColdLight OWNS all ARIA. No MeltUI dependency.
	Reference: WAI-ARIA APG Grid Pattern
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { type RangeCalendarContext, setRangeCalendarContext } from "./context.js";
import type { RangeCalendarProps } from "./types.js";

let {
	startDate = undefined,
	endDate = undefined,
	onRangeChange,
	month,
	onMonthChange,
	min,
	max,
	disabled = false,
	locale = "en-US",
	size = "md",
	children,
	class: className,
	...rest
}: RangeCalendarProps = $props();

const headingId = `rcal-heading-${Math.random().toString(36).slice(2, 9)}`;
const today = new Date();
today.setHours(0, 0, 0, 0);

let currentMonth = $state(new Date());

$effect(() => {
	const m = month ?? startDate;
	if (m) currentMonth = m;
});
let hoveredDate = $state<Date | undefined>(undefined);
let selectingEnd = $state(false);

function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

const ctx: RangeCalendarContext = {
	get currentMonth() {
		return currentMonth;
	},
	get startDate() {
		return startDate;
	},
	get endDate() {
		return endDate;
	},
	get hoveredDate() {
		return hoveredDate;
	},
	today,
	get min() {
		return min;
	},
	get max() {
		return max;
	},
	get disabled() {
		return disabled;
	},
	get locale() {
		return locale;
	},
	get size() {
		return size;
	},
	headingId,
	prevMonth() {
		const prev = new Date(currentMonth);
		prev.setMonth(prev.getMonth() - 1);
		currentMonth = prev;
		onMonthChange?.(prev);
	},
	nextMonth() {
		const next = new Date(currentMonth);
		next.setMonth(next.getMonth() + 1);
		currentMonth = next;
		onMonthChange?.(next);
	},
	selectDate(date: Date) {
		if (disabled || ctx.isDateDisabled(date)) return;
		if (!selectingEnd || !startDate) {
			// First click: set start
			onRangeChange?.({ start: date, end: undefined });
			selectingEnd = true;
		} else {
			// Second click: set end (swap if needed)
			if (date < startDate) {
				onRangeChange?.({ start: date, end: startDate });
			} else {
				onRangeChange?.({ start: startDate, end: date });
			}
			selectingEnd = false;
		}
	},
	setHoveredDate(date: Date | undefined) {
		hoveredDate = date;
	},
	isDateDisabled(date: Date): boolean {
		if (disabled) return true;
		if (min && date < min) return true;
		if (max && date > max) return true;
		return false;
	},
	isOutsideMonth(date: Date): boolean {
		return date.getMonth() !== currentMonth.getMonth();
	},
	isRangeStart(date: Date): boolean {
		return startDate ? isSameDay(startDate, date) : false;
	},
	isRangeEnd(date: Date): boolean {
		return endDate ? isSameDay(endDate, date) : false;
	},
	isInRange(date: Date): boolean {
		if (!startDate) return false;
		const end = endDate ?? hoveredDate;
		if (!end) return false;
		const rangeStart = startDate < end ? startDate : end;
		const rangeEnd = startDate < end ? end : startDate;
		return date > rangeStart && date < rangeEnd;
	},
	isSelected(date: Date): boolean {
		return ctx.isRangeStart(date) || ctx.isRangeEnd(date);
	},
	isToday(date: Date): boolean {
		return isSameDay(today, date);
	},
};

setRangeCalendarContext(ctx);

</script>

<div
	role="group"
	aria-label="Range Calendar"
	class={cn(className, className)}
	data-kind="range-calendar"
	data-slot="root"
	data-state={disabled ? "disabled" : undefined}
	{...rest}
>
	{@render children?.()}
</div>
