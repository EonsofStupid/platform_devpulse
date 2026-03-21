<!--
	@component Calendar.Cell
	@kind calendar
	@slot cell
	@layer components

	Individual day cell with ARIA gridcell role.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCalendarContext } from "./context.js";
import type { CalendarCellProps } from "./types.js";

let { date, children, class: className, ...rest }: CalendarCellProps = $props();
const ctx = getCalendarContext();

const isSelected = $derived(ctx.isSelected(date));
const isToday = $derived(ctx.isToday(date));
const isDateDisabled = $derived(ctx.isDateDisabled(date));
const isOutside = $derived(ctx.isOutsideMonth(date));

const state = $derived(
	isSelected ? "selected"
	: isToday ? "today"
	: isDateDisabled ? "disabled"
	: isOutside ? "outside-month"
	: undefined,
);
</script>

<button
	type="button"
	role="gridcell"
	class={cn(ctx.classes.cell, className)}
	aria-selected={isSelected}
	aria-disabled={isDateDisabled || undefined}
	aria-current={isToday ? "date" : undefined}
	data-kind="calendar"
	data-slot="cell"
	data-state={state}
	tabindex={isSelected || (isToday && !ctx.selectedDate) ? 0 : -1}
	disabled={isDateDisabled || isOutside}
	onclick={() => ctx.selectDate(date)}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		{date.getDate()}
	{/if}
</button>
