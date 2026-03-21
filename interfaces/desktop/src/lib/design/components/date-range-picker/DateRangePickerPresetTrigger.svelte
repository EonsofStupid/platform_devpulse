<!--
	@component DateRangePicker.PresetTrigger
	@kind date-range-picker
	@slot preset-trigger
	@layer components

	Quick-select predefined date ranges (e.g., "Last 7 days").
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDateRangePickerContext } from "./context.js";
import type { DateRangePickerPresetTriggerProps } from "./types.js";

let { preset, children, class: className, ...rest }: DateRangePickerPresetTriggerProps = $props();
const ctx = getDateRangePickerContext();

function handleClick() {
	ctx.selectRange(preset.value);
}
</script>

<button
	type="button"
	data-kind="date-range-picker"
	data-slot="preset-trigger"
	class={cn(ctx.classes.presetTrigger, className)}
	disabled={ctx.isDisabled}
	onclick={handleClick}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		{preset.label}
	{/if}
</button>
