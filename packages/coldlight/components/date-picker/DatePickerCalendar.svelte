<!--
	@component DatePicker.Calendar
	@kind date-picker
	@slot calendar
	@layer components

	Embedded calendar within the popover.
	Consumer places Calendar.Root + sub-components inside,
	or uses this as a styled container.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getDatePickerContext } from "./context.js";
import type { DatePickerCalendarProps } from "./types.js";

let { children, class: className, ...rest }: DatePickerCalendarProps = $props();
const ctx = getDatePickerContext();
</script>

<div
	data-kind="date-picker"
	data-slot="calendar"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
