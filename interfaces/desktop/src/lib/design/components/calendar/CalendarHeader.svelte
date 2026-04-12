<!--
	@component Calendar.Header
	@kind calendar
	@slot header
	@layer components

	Header with month/year heading and prev/next navigation buttons.
	Every attribute comes from useCalendar via context — no inline ARIA,
	no hand-rolled keyboard handling.
-->
<script lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-svelte";
import { cn } from "$lib/design/utils/cn.js";
import { getCalendarContext } from "./context.js";
import type { CalendarHeaderProps } from "./types.js";

let { children, class: className, ...rest }: CalendarHeaderProps = $props();
const cal = getCalendarContext();
</script>

<div class={cn(className)} data-kind="calendar" data-slot="header" {...rest}>
	{#if children}
		{@render children()}
	{:else}
		<button {...cal.prevButton}><ChevronLeft size={16} aria-hidden="true" /></button>
		<div {...cal.heading}>{cal.headingText}</div>
		<button {...cal.nextButton}><ChevronRight size={16} aria-hidden="true" /></button>
	{/if}
</div>
