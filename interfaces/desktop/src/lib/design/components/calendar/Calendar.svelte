<!--
	@component Calendar
	@kind calendar
	@layer components

	ColdLight Calendar root — manages state and provides context.
	Compound component: sub-components consume context to render slots.

	ColdLight OWNS all ARIA. No MeltUI dependency.
	Reference: WAI-ARIA APG Grid Pattern
-->
<script lang="ts">
	import type { CalendarProps } from "./types.js";
	import { setCalendarContext, type CalendarContext } from "./context.js";
	import { calendarRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		value = undefined,
		onValueChange,
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
	}: CalendarProps = $props();

	const headingId = `cal-heading-${Math.random().toString(36).slice(2, 9)}`;
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let currentMonth = $state(new Date());

	$effect(() => {
		const m = month ?? value;
		if (m) currentMonth = m;
	});

	function isSameDay(a: Date, b: Date): boolean {
		return (
			a.getFullYear() === b.getFullYear() &&
			a.getMonth() === b.getMonth() &&
			a.getDate() === b.getDate()
		);
	}

	const ctx: CalendarContext = {
		get currentMonth() {
			return currentMonth;
		},
		get selectedDate() {
			return value;
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
			onValueChange?.(date);
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
		isSelected(date: Date): boolean {
			return value ? isSameDay(value, date) : false;
		},
		isToday(date: Date): boolean {
			return isSameDay(today, date);
		},
	};

	setCalendarContext(ctx);

	const recipe = $derived(calendarRecipe({ size }));
</script>

<div
	role="group"
	aria-label="Calendar"
	class={cn(recipe.root, className)}
	data-kind="calendar"
	data-slot="root"
	data-state={disabled ? "disabled" : undefined}
	{...rest}
>
	{@render children?.()}
</div>
