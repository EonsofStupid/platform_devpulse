<!--
	@component RangeCalendarGrid
	@kind range-calendar
	@slot grid
	@layer components

	Grid table with day-of-week headers and week rows.
	ColdLight-owned ARIA with role="grid" and aria-multiselectable.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRangeCalendarContext } from "./context.js";
import type { RangeCalendarGridProps } from "./types.js";

let { children, class: className, ...rest }: RangeCalendarGridProps = $props();
const ctx = getRangeCalendarContext();

const weekDayNames = $derived(
	Array.from({ length: 7 }, (_, i) => {
		const sunday = new Date(2024, 0, i - 1);
		return sunday.toLocaleDateString(ctx.locale, { weekday: "short" });
	}));

function getCalendarDates(month: Date): Date[][] {
	const year = month.getFullYear();
	const m = month.getMonth();
	const firstDay = new Date(year, m, 1);
	const startOffset = firstDay.getDay();
	const start = new Date(year, m, 1 - startOffset);

	const weeks: Date[][] = [];
	const current = new Date(start);

	for (let w = 0; w < 6; w++) {
		const week: Date[] = [];
		for (let d = 0; d < 7; d++) {
			week.push(new Date(current));
			current.setDate(current.getDate() + 1);
		}
		weeks.push(week);
		if (current.getMonth() !== m && w >= 3) break;
	}
	return weeks;
}

const weeks = $derived(getCalendarDates(ctx.currentMonth));
</script>

<table
	role="grid"
	aria-labelledby={ctx.headingId}
	aria-multiselectable="true"
	class={cn(className, className)}
	data-kind="range-calendar"
	data-slot="grid"
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		<thead>
			<tr>
				{#each weekDayNames as dayName}
					<th scope="col" class={className} abbr={dayName}>
						{dayName}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each weeks as week}
				<tr>
					{#each week as date}
						{@const isRangeStart = ctx.isRangeStart(date)}
						{@const isRangeEnd = ctx.isRangeEnd(date)}
						{@const isInRange = ctx.isInRange(date)}
						{@const isSelected = ctx.isSelected(date)}
						{@const isToday = ctx.isToday(date)}
						{@const isDisabled = ctx.isDateDisabled(date)}
						{@const isOutside = ctx.isOutsideMonth(date)}
						{@const state = isRangeStart ? "range-start" : isRangeEnd ? "range-end" : isInRange ? "in-range" : isSelected ? "selected" : isToday ? "today" : isDisabled ? "disabled" : isOutside ? "outside-month" : undefined}
						<td>
							<button
								type="button"
								role="gridcell"
								class={className}
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
							>
								{date.getDate()}
							</button>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	{/if}
</table>
