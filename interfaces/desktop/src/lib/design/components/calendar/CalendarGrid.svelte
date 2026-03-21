<!--
	@component Calendar.Grid
	@kind calendar
	@slot grid
	@layer components

	Grid table with day-of-week headers and week rows.
	role="grid" with aria-labelledby.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCalendarContext } from "./context.js";
import type { CalendarGridProps } from "./types.js";

let { children, class: className, ...rest }: CalendarGridProps = $props();
const ctx = getCalendarContext();

const weekDayNames = $derived(
	Array.from({ length: 7 }, (_, i) => {
		const sunday = new Date(2024, 0, i - 1);
		return sunday.toLocaleDateString(ctx.locale, { weekday: "short" });
	}),
);

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
	id={ctx.ids.grid}
	aria-labelledby={ctx.headingId}
	class={cn(ctx.classes.grid, className)}
	data-kind="calendar"
	data-slot="grid"
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		<thead>
			<tr>
				{#each weekDayNames as dayName}
					<th scope="col" class={ctx.classes.headCell} abbr={dayName}>
						{dayName}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each weeks as week}
				<tr>
					{#each week as date}
						{@const isSelected = ctx.isSelected(date)}
						{@const isToday = ctx.isToday(date)}
						{@const isDateDisabled = ctx.isDateDisabled(date)}
						{@const isOutside = ctx.isOutsideMonth(date)}
						{@const state = isSelected ? "selected" : isToday ? "today" : isDateDisabled ? "disabled" : isOutside ? "outside-month" : undefined}
						<td>
							<button
								type="button"
								role="gridcell"
								class={ctx.classes.cell}
								aria-selected={isSelected}
								aria-disabled={isDateDisabled || undefined}
								aria-current={isToday ? "date" : undefined}
								data-kind="calendar"
								data-slot="cell"
								data-state={state}
								tabindex={isSelected || (isToday && !ctx.selectedDate) ? 0 : -1}
								disabled={isDateDisabled || isOutside}
								onclick={() => ctx.selectDate(date)}
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
