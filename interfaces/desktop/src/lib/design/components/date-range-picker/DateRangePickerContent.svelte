<!--
	@component DateRangePickerContent
	@kind date-range-picker
	@slot content
	@layer components

	Popover container for the range calendar.
	ColdLight-owned ARIA — role="dialog", aria-modal, Escape to close.
-->
<script lang="ts">
	import type { DateRangePickerContentProps } from "./types.js";
	import { getDateRangePickerContext } from "./context.js";
	import { dateRangePickerRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { children, class: className, ...rest }: DateRangePickerContentProps = $props();
	const ctx = getDateRangePickerContext();
	const recipe = $derived(dateRangePickerRecipe({ size: ctx.size }));

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
		aria-label="Choose date range"
		class={cn(recipe.content, className)}
		data-kind="date-range-picker"
		data-slot="content"
		data-state={ctx.open ? "open" : "closed"}
		onkeydown={handleKeydown}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
