<!--
	@component DateRangePickerTrigger
	@kind date-range-picker
	@slot trigger
	@layer components

	Button that opens/closes the range calendar popover.
	ColdLight-owned ARIA — aria-haspopup, aria-expanded, aria-controls.
-->
<script lang="ts">
	import type { DateRangePickerTriggerProps } from "./types.js";
	import { getDateRangePickerContext } from "./context.js";
	import { dateRangePickerRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { children, class: className, ...rest }: DateRangePickerTriggerProps = $props();
	const ctx = getDateRangePickerContext();
	const recipe = $derived(dateRangePickerRecipe({ size: ctx.size }));

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			ctx.openPopover();
		}
	}
</script>

<button
	type="button"
	id={ctx.triggerId}
	class={cn(recipe.trigger, className)}
	aria-haspopup="dialog"
	aria-expanded={ctx.open}
	aria-controls={ctx.open ? ctx.contentId : undefined}
	aria-label="Open range calendar"
	data-kind="date-range-picker"
	data-slot="trigger"
	data-state={ctx.open ? "open" : "closed"}
	disabled={ctx.disabled}
	onclick={() => ctx.toggle()}
	onkeydown={handleKeydown}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		&#128197;
	{/if}
</button>
