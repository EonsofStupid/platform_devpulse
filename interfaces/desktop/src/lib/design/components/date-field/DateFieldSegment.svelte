<!--
	@component DateFieldSegment
	@kind date-field
	@slot segment
	@layer components

	Individual segment with spinbutton ARIA role.
	ColdLight-owned — renders aria-valuemin, aria-valuemax, aria-valuenow directly.
-->
<script lang="ts">
	import type { DateFieldSegmentProps } from "./types.js";
	import { getDateFieldContext } from "./context.js";
	import { dateFieldRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { segment, index, children, class: className, ...rest }: DateFieldSegmentProps = $props();
	const ctx = getDateFieldContext();
	const recipe = $derived(dateFieldRecipe({ size: ctx.size }));

	const isLiteral = $derived(segment.type === "literal");
	const isFocused = $derived(ctx.focusedIndex === index);
	const displayValue = $derived(segment.numericValue !== undefined ? segment.value : segment.placeholder);

	function handleKeydown(e: KeyboardEvent) {
		if (ctx.disabled || ctx.readonly || isLiteral) return;

		switch (e.key) {
			case "ArrowUp":
				e.preventDefault();
				ctx.incrementSegment(index);
				break;
			case "ArrowDown":
				e.preventDefault();
				ctx.decrementSegment(index);
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
					ctx.setSegmentValue(index, parseInt(e.key, 10));
				}
				break;
		}
	}
</script>

{#if isLiteral}
	<span
		class={cn(recipe.literal, className)}
		data-kind="date-field"
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
		aria-label={segment.type}
		aria-readonly={ctx.readonly || undefined}
		data-kind="date-field"
		data-slot="segment"
		data-state={ctx.disabled ? "disabled" : ctx.readonly ? "readonly" : isFocused ? "focused" : undefined}
		data-placeholder={segment.numericValue === undefined ? "" : undefined}
		tabindex={ctx.disabled ? -1 : 0}
		onfocus={() => ctx.focusSegment(index)}
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
