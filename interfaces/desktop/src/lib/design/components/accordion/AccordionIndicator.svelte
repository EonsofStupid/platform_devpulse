<!--
	@component Accordion.Indicator
	@kind accordion
	@slot indicator

	Caret/chevron that rotates based on open state.
-->
<script lang="ts">
import { getAccordionContext, getAccordionItemContext } from "./context.js";
import type { AccordionIndicatorProps } from "./types.js";

let { children, element, class: className, ...rest }: AccordionIndicatorProps = $props();
const ctx = getAccordionContext();
const item = getAccordionItemContext();

const itemAttrs = $derived(ctx.hook.getItem(item.value));
const isOpen = $derived(itemAttrs["data-state"] === "open");

const attrs = $derived({
	"data-kind": "accordion" as const,
	"data-slot": "indicator" as const,
	"data-state": isOpen ? ("open" as const) : ("closed" as const),
	"aria-hidden": true as const,
	class: `transition-transform ${isOpen ? "rotate-180" : ""} ${className ?? ""}`.trim(),
	...rest,
});
</script>

{#if element}
	{@render element(attrs)}
{:else}
	<span {...attrs}>
		{#if children}
			{@render children()}
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="size-3xs"
			>
				<path d="m6 9 6 6 6-6" />
			</svg>
		{/if}
	</span>
{/if}
