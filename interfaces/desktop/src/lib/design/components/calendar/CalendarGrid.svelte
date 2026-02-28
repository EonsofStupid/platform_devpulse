<!--
	@component CalendarGrid
	@kind calendar
	@slot grid
	@layer components

	Grid table with day-of-week headers and week rows.
	ColdLight-owned ARIA with role="grid".
-->
<script lang="ts">
	import type { CalendarGridProps } from "./types.js";
	import { getCalendarContext } from "./context.js";
	import { calendarRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { children, class: className, ...rest }: CalendarGridProps = $props();
	const ctx = getCalendarContext();
	const recipe = $derived(calendarRecipe({ size: ctx.size }));

	const weekDayNames = $derived(
		Array.from({ length: 7 }, (_, i) => {
			const d = new Date(2024, 0, i); // Jan 2024 starts on Monday
			// Adjust to start week on Sunday
			const sunday = new Date(2024, 0, i - 1);
			return sunday.toLocaleDateString(ctx.locale, { weekday: "short" });
		}),
	);

	/** Get all dates to display in the calendar grid */
	function getCalendarDates(month: Date): Date[][] {
		const year = month.getFullYear();
		const m = month.getMonth();
		const firstDay = new Date(year, m, 1);
		const startOffset = firstDay.getDay(); // 0 = Sunday
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
			// Stop if we've passed the current month and started a new week
			if (current.getMonth() !== m && w >= 3) break;
		}
		return weeks;
	}

	const weeks = $derived(getCalendarDates(ctx.currentMonth));
</script>

<table
	role="grid"
	aria-labelledby={ctx.headingId}
	class={cn(recipe.grid, className)}
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
					<th scope="col" class={recipe.headCell} abbr={dayName}>
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
						{@const isDisabled = ctx.isDateDisabled(date)}
						{@const isOutside = ctx.isOutsideMonth(date)}
						{@const state = isSelected ? "selected" : isToday ? "today" : isDisabled ? "disabled" : isOutside ? "outside-month" : undefined}
						<td role="presentation">
							<button
								type="button"
								role="gridcell"
								class={recipe.cell}
								aria-selected={isSelected}
								aria-disabled={isDisabled || undefined}
								aria-current={isToday ? "date" : undefined}
								data-kind="calendar"
								data-slot="cell"
								data-state={state}
								tabindex={isSelected || (ctx.isToday(date) && !ctx.selectedDate) ? 0 : -1}
								disabled={isDisabled || isOutside}
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
