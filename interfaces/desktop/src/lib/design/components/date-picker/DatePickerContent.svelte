<!--
	@component DatePickerContent
	@kind date-picker
	@slot content
	@layer components

	Popover container for the calendar.
	ColdLight-owned ARIA — role="dialog", aria-modal, Escape to close.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getDatePickerContext } from "./context.js";
import { datePickerRecipe } from "./recipe.js";
import type { DatePickerContentProps } from "./types.js";

let { children, class: className, ...rest }: DatePickerContentProps = $props();
const ctx = getDatePickerContext();
const recipe = $derived(datePickerRecipe({ size: ctx.size }));

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		e.preventDefault();
		ctx.closePopover();
	}
}
</script>

{#if ctx.open}
	<div
		id={ctx.contentId}
		role="dialog"
		aria-modal="true"
		aria-label="Choose date"
		class={cn(recipe.content, className)}
		data-kind="date-picker"
		data-slot="content"
		data-state={ctx.open ? "open" : "closed"}
		onkeydown={handleKeydown}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
