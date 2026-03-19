<!--
	@component DatePickerCalendar
	@kind date-picker
	@slot calendar
	@layer components

	Embedded calendar within the popover.
	ColdLight-owned — delegates to Calendar component context.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDatePickerContext } from "./context.js";
import { datePickerRecipe } from "./recipe.js";
import type { DatePickerCalendarProps } from "./types.js";

let { children, class: className, ...rest }: DatePickerCalendarProps = $props();
const ctx = getDatePickerContext();
const recipe = $derived(datePickerRecipe({ size: ctx.size }));
</script>

<div
	class={cn(recipe.calendar, className)}
	data-kind="date-picker"
	data-slot="calendar"
	{...rest}
>
	{@render children?.()}
</div>
