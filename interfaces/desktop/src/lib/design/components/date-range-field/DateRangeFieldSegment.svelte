<!--
	@component DateRangeFieldSegment
	@kind date-range-field
	@slot segment
	@layer components

	Individual segment with spinbutton ARIA role for range fields.
	ColdLight-owned — renders aria-valuemin, aria-valuemax, aria-valuenow directly.
-->
<script lang="ts">
	import type { DateRangeFieldSegmentProps } from "./types.js";
	import { getDateRangeFieldContext } from "./context.js";
	import { dateRangeFieldRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { segment, index, field, children, class: className, ...rest }: DateRangeFieldSegmentProps = $props();
	const ctx = getDateRangeFieldContext();
	const recipe = $derived(dateRangeFieldRecipe({ size: ctx.size }));

	const isLiteral = $derived(segment.type === "literal");
	const isFocused = $derived(ctx.focusedField === field && ctx.focusedIndex === index);
	const displayValue = $derived(segment.numericValue !== undefined ? segment.value : segment.placeholder);

	function handleKeydown(e: KeyboardEvent) {
		if (ctx.disabled || ctx.readonly || isLiteral) return;

		switch (e.key) {
			case "ArrowUp":
				e.preventDefault();
				ctx.incrementSegment(field, index);
				break;
			case "ArrowDown":
				e.preventDefault();
				ctx.decrementSegment(field, index);
				break;
			case "ArrowLeft":
				e.preventDefault();
				ctx.focusPrevSegment();
				break;
			case "ArrowRight":
				e.preventDefault();
				ctx.focusNextSegment();
				break;
			default:
				if (/^\d$/.test(e.key)) {
					e.preventDefault();
					ctx.setSegmentValue(field, index, parseInt(e.key, 10));
				}
				break;
		}
	}
</script>

{#if isLiteral}
	<span
		class={cn(recipe.literal, className)}
		data-kind="date-range-field"
		data-slot="literal"
		aria-hidden="true"
		{...rest}
	>
		{segment.value}
	</span>
{:else}
	<span
		role="spinbutton"
		class={cn(recipe.segment, className)}
		aria-valuemin={segment.min}
		aria-valuemax={segment.max}
		aria-valuenow={segment.numericValue ?? undefined}
		aria-valuetext={displayValue}
		aria-label={`${field} ${segment.type}`}
		aria-readonly={ctx.readonly || undefined}
		data-kind="date-range-field"
		data-slot="segment"
		data-state={ctx.disabled ? "disabled" : ctx.readonly ? "readonly" : isFocused ? "focused" : undefined}
		data-placeholder={segment.numericValue === undefined ? "" : undefined}
		tabindex={ctx.disabled ? -1 : 0}
		onfocus={() => ctx.focusSegment(field, index)}
		onkeydown={handleKeydown}
		{...rest}
	>
		{#if children}
			{@render children()}
		{:else}
			{displayValue}
		{/if}
	</span>
{/if}
