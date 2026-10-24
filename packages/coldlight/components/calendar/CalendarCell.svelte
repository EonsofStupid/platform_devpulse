<!--
	@component Calendar.Cell
	@kind calendar
	@slot cell
	@layer components

	Individual day cell. All ARIA, state attributes, focus management,
	and keyboard handlers come from useCalendar.cell(date) — this
	component is presentational only.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getCalendarContext } from "./context.js";
import type { CalendarCellProps } from "./types.js";

let { date, children, class: className, ...rest }: CalendarCellProps = $props();
const cal = getCalendarContext();
const attrs = $derived(cal.cell(date));
</script>

<button {...attrs} class={cn(className)} {...rest}>
	{#if children}
		{@render children()}
	{:else}
		{date.getDate()}
	{/if}
</button>
