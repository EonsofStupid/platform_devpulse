<!--
	@component DateField.Segment
	@kind date-field
	@slot segment
	@layer components

	Individual segment with spinbutton ARIA role.
	Up/Down to increment/decrement. Left/Right to navigate segments.
	Digit keys to type values directly.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDateFieldContext } from "./context.js";
import type { DateFieldSegmentProps } from "./types.js";

let { segment, index, children, class: className, ...rest }: DateFieldSegmentProps = $props();
const ctx = getDateFieldContext();

const isLiteral = $derived(segment.type === "literal");
const isFocused = $derived(ctx.focusedIndex === index);
const displayValue = $derived(segment.numericValue !== undefined ? segment.value : segment.placeholder);

function handleKeydown(e: KeyboardEvent) {
	if (ctx.isDisabled || ctx.isReadOnly || isLiteral) return;

	switch (e.key) {
		case "ArrowUp": e.preventDefault(); ctx.incrementSegment(index); break;
		case "ArrowDown": e.preventDefault(); ctx.decrementSegment(index); break;
		case "ArrowLeft": e.preventDefault(); ctx.focusPrevSegment(); break;
		case "ArrowRight": e.preventDefault(); ctx.focusNextSegment(); break;
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
		class={cn(ctx.classes.literal, className)}
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
		class={cn(ctx.classes.segment, className)}
		aria-valuemin={segment.min}
		aria-valuemax={segment.max}
		aria-valuenow={segment.numericValue ?? undefined}
		aria-valuetext={displayValue}
		aria-label={segment.type}
		aria-readonly={ctx.isReadOnly || undefined}
		data-kind="date-field"
		data-slot="segment"
		data-type={segment.type}
		data-state={ctx.isDisabled ? "disabled" : ctx.isReadOnly ? "readonly" : isFocused ? "focused" : undefined}
		data-placeholder={segment.numericValue === undefined ? "" : undefined}
		tabindex={ctx.isDisabled ? -1 : 0}
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
