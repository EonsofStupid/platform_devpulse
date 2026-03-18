<!--
	@component CalendarCell
	@kind calendar
	@slot cell
	@layer components

	Individual day cell with ARIA gridcell role.
	ColdLight-owned — renders aria-selected, aria-disabled, aria-current directly.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getCalendarContext } from "./context.js";
import { calendarRecipe } from "./recipe.js";
import type { CalendarCellProps } from "./types.js";

let { date, children, class: className, ...rest }: CalendarCellProps = $props();
const ctx = getCalendarContext();
const recipe = $derived(calendarRecipe({ size: ctx.size }));

const isSelected = $derived(ctx.isSelected(date));
const isToday = $derived(ctx.isToday(date));
const isDisabled = $derived(ctx.isDateDisabled(date));
const isOutside = $derived(ctx.isOutsideMonth(date));

const state = $derived(
	isSelected
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
	class={cn(recipe.cell, className)}
	aria-selected={isSelected}
	aria-disabled={isDisabled || undefined}
	aria-current={isToday ? "date" : undefined}
	data-kind="calendar"
	data-slot="cell"
	data-state={state}
	tabindex={isSelected || (isToday && !ctx.selectedDate) ? 0 : -1}
	disabled={isDisabled || isOutside}
	onclick={() => ctx.selectDate(date)}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		{date.getDate()}
	{/if}
</button>
