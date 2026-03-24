<!--
	@component DateRangePicker.Calendar
	@kind date-range-picker
	@slot calendar
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDateRangePickerContext } from "./context.js";
import type { DateRangePickerCalendarProps } from "./types.js";

let { children, class: className, ...rest }: DateRangePickerCalendarProps = $props();
const ctx = getDateRangePickerContext();
</script>

<div
	data-kind="date-range-picker"
	data-slot="calendar"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
