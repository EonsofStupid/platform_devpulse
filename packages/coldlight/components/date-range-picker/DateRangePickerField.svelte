<!--
	@component DateRangePicker.Input
	@kind date-range-picker
	@slot field
	@layer components

	Indexed input — index=0 for start, index=1 for end.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getDateRangePickerContext } from "./context.js";
import type { DateRangePickerInputProps } from "./types.js";

let { index, children, class: className, ...rest }: DateRangePickerInputProps = $props();
const ctx = getDateRangePickerContext();

const fieldId = $derived(index === 0 ? ctx.ids.startField : ctx.ids.endField);
</script>

<div
	id={fieldId}
	role="group"
	aria-label={index === 0 ? "Start date" : "End date"}
	data-kind="date-range-picker"
	data-slot="field"
	data-index={index}
	data-state={ctx.isDisabled ? "disabled" : undefined}
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
