<!--
	@component DateRangePicker.Content
	@kind date-range-picker
	@slot content
	@layer components
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getDateRangePickerContext } from "./context.js";
import type { DateRangePickerContentProps } from "./types.js";

let { children, class: className, ...rest }: DateRangePickerContentProps = $props();
const ctx = getDateRangePickerContext();

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		e.preventDefault();
		ctx.closePopover();
	}
}
</script>

{#if ctx.isOpen || ctx.inline}
	<div
		id={ctx.ids.content}
		role={ctx.inline ? undefined : "dialog"}
		aria-modal={ctx.inline ? undefined : "true"}
		aria-label="Choose date range"
		data-kind="date-range-picker"
		data-slot="content"
		data-state={ctx.isOpen ? "open" : "closed"}
		class={cn(className)}
		onkeydown={ctx.inline ? undefined : handleKeydown}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
