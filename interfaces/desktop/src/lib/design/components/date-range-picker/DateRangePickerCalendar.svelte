<!--
	@component DateRangePickerCalendar
	@kind date-range-picker
	@slot calendar
	@layer components

	Embedded range calendar within the popover.
	ColdLight-owned — delegates to RangeCalendar component context.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDateRangePickerContext } from "./context.js";
import { dateRangePickerRecipe } from "./recipe.js";
import type { DateRangePickerCalendarProps } from "./types.js";

let { children, class: className, ...rest }: DateRangePickerCalendarProps = $props();
const ctx = getDateRangePickerContext();
const recipe = $derived(dateRangePickerRecipe({ size: ctx.size }));
</script>

<div
	class={cn(recipe.calendar, className)}
	data-kind="date-range-picker"
	data-slot="calendar"
	{...rest}
>
	{@render children?.()}
</div>
