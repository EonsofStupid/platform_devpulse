<!--
	@component DatePicker.Content
	@kind date-picker
	@slot content
	@layer components

	Popover container for the calendar. role="dialog".
	Escape to close.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getDatePickerContext } from "./context.js";
import type { DatePickerContentProps } from "./types.js";

let { children, class: className, ...rest }: DatePickerContentProps = $props();
const ctx = getDatePickerContext();

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		e.preventDefault();
		ctx.closePopover();
	}
}
</script>

{#if ctx.isOpen}
	<div
		id={ctx.ids.content}
		role="dialog"
		aria-modal="true"
		aria-label="Choose date"
		data-kind="date-picker"
		data-slot="content"
		data-state="open"
		class={cn(className)}
		onkeydown={handleKeydown}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
