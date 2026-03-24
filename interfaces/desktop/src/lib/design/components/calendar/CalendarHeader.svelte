<!--
	@component Calendar.Header
	@kind calendar
	@slot header
	@layer components

	Header with month/year heading and prev/next navigation buttons.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCalendarContext } from "./context.js";
import type { CalendarHeaderProps } from "./types.js";

let { children, class: className, ...rest }: CalendarHeaderProps = $props();
const ctx = getCalendarContext();

const headingText = $derived(
	ctx.currentMonth.toLocaleDateString(ctx.locale, {
		month: "long",
		year: "numeric",
	}));
</script>

<div
	class={cn(className)}
	data-kind="calendar"
	data-slot="header"
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		<button
			type="button"
			id={ctx.ids.prevButton}
			class=""
			aria-label="Previous month"
			data-kind="calendar"
			data-slot="prev-button"
			onclick={() => ctx.prevMonth()}
			disabled={ctx.isDisabled}
		>
			&#8249;
		</button>
		<div
			id={ctx.headingId}
			class=""
			aria-live="polite"
			data-kind="calendar"
			data-slot="heading"
		>
			{headingText}
		</div>
		<button
			type="button"
			id={ctx.ids.nextButton}
			class=""
			aria-label="Next month"
			data-kind="calendar"
			data-slot="next-button"
			onclick={() => ctx.nextMonth()}
			disabled={ctx.isDisabled}
		>
			&#8250;
		</button>
	{/if}
</div>
