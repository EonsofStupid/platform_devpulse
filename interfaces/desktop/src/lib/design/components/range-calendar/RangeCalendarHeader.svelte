<!--
	@component RangeCalendarHeader
	@kind range-calendar
	@slot header
	@layer components

	Header with month/year heading and prev/next navigation buttons.
	ColdLight-owned ARIA.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRangeCalendarContext } from "./context.js";
import { rangeCalendarRecipe } from "./recipe.js";
import type { RangeCalendarHeaderProps } from "./types.js";

let { children, class: className, ...rest }: RangeCalendarHeaderProps = $props();
const ctx = getRangeCalendarContext();
const recipe = $derived(rangeCalendarRecipe({ size: ctx.size }));

const headingText = $derived(
	ctx.currentMonth.toLocaleDateString(ctx.locale, {
		month: "long",
		year: "numeric",
	}));
</script>

<div
	class={cn(recipe.header, className)}
	data-kind="range-calendar"
	data-slot="header"
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		<button
			type="button"
			class={recipe.navButton}
			aria-label="Previous month"
			data-kind="range-calendar"
			data-slot="prev-button"
			onclick={() => ctx.prevMonth()}
			disabled={ctx.disabled}
		>
			&#8249;
		</button>
		<div
			id={ctx.headingId}
			class={recipe.heading}
			aria-live="polite"
			data-kind="range-calendar"
			data-slot="heading"
		>
			{headingText}
		</div>
		<button
			type="button"
			class={recipe.navButton}
			aria-label="Next month"
			data-kind="range-calendar"
			data-slot="next-button"
			onclick={() => ctx.nextMonth()}
			disabled={ctx.disabled}
		>
			&#8250;
		</button>
	{/if}
</div>
