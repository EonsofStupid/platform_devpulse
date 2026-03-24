<!--
	@component DateRangePicker.Trigger
	@kind date-range-picker
	@slot trigger
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDateRangePickerContext } from "./context.js";
import type { DateRangePickerTriggerProps } from "./types.js";

let { children, class: className, ...rest }: DateRangePickerTriggerProps = $props();
const ctx = getDateRangePickerContext();
</script>

<button
	type="button"
	id={ctx.ids.trigger}
	aria-haspopup="dialog"
	aria-expanded={ctx.isOpen}
	aria-controls={ctx.isOpen ? ctx.ids.content : undefined}
	aria-label="Open calendar"
	disabled={ctx.isDisabled}
	data-kind="date-range-picker"
	data-slot="trigger"
	data-state={ctx.isOpen ? "open" : "closed"}
	class={cn(className)}
	onclick={() => ctx.toggle()}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3xs" aria-hidden="true">
			<path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
		</svg>
	{/if}
</button>
