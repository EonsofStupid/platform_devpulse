<!--
	@component RangeCalendarCell
	@kind range-calendar
	@slot cell
	@layer components

	Individual day cell with range awareness.
	ColdLight-owned — renders range-start, range-end, in-range states.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getRangeCalendarContext } from "./context.js";
import type { RangeCalendarCellProps } from "./types.js";

let { date, children, class: className, ...rest }: RangeCalendarCellProps = $props();
const ctx = getRangeCalendarContext();

const isRangeStart = $derived(ctx.isRangeStart(date));
const isRangeEnd = $derived(ctx.isRangeEnd(date));
const isInRange = $derived(ctx.isInRange(date));
const isSelected = $derived(ctx.isSelected(date));
const isToday = $derived(ctx.isToday(date));
const isDisabled = $derived(ctx.isDateDisabled(date));
const isOutside = $derived(ctx.isOutsideMonth(date));

const state = $derived(
	isRangeStart
		? "range-start"
		: isRangeEnd
			? "range-end"
			: isInRange
				? "in-range"
				: isSelected
					? "selected"
					: isToday
						? "today"
						: isDisabled
							? "disabled"
							: isOutside
								? "outside-month"
								: undefined,
);
</script>

<button
	type="button"
	role="gridcell"
	class={cn(className)}
	aria-selected={isSelected || isInRange}
	aria-disabled={isDisabled || undefined}
	aria-current={isToday ? "date" : undefined}
	data-kind="range-calendar"
	data-slot="cell"
	data-state={state}
	tabindex={isRangeStart || (isToday && !ctx.startDate) ? 0 : -1}
	disabled={isDisabled || isOutside}
	onclick={() => ctx.selectDate(date)}
	onmouseenter={() => ctx.setHoveredDate(date)}
	onmouseleave={() => ctx.setHoveredDate(undefined)}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		{date.getDate()}
	{/if}
</button>
