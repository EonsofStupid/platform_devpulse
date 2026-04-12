<!--
	@component Calendar.Grid
	@kind calendar
	@slot grid
	@layer components

	Tabular day grid. All cells pull their attributes from useCalendar
	so keyboard navigation, roving tabindex, and ARIA selection state
	are single-sourced.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCalendarContext } from "./context.js";
import type { CalendarGridProps } from "./types.js";

let { children, class: className, ...rest }: CalendarGridProps = $props();
const cal = getCalendarContext();
</script>

<table {...cal.grid} class={cn(className)} {...rest}>
	{#if children}
		{@render children()}
	{:else}
		<thead>
			<tr>
				{#each cal.weekDays as day (day.index)}
					<th {...cal.columnHeader(day)}>{day.abbr}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each cal.weeks as week, weekIdx (weekIdx)}
				<tr>
					{#each week as date (`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`)}
						<td>
							<button {...cal.cell(date)}>{date.getDate()}</button>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	{/if}
</table>
