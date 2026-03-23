<!--
	@component Accordion.Content
	@kind accordion
	@slot content

	DUMB. Expandable panel with slide transition.
	ARIA (role=region, aria-labelledby) from primitive hook.
-->
<script lang="ts">
import { slide } from "svelte/transition";
import { getAccordionContext, getAccordionItemContext } from "./context.js";
import type { AccordionContentProps } from "./types.js";

let { children, class: className, ...rest }: AccordionContentProps = $props();
const ctx = getAccordionContext();
const item = getAccordionItemContext();

const contentAttrs = $derived(ctx.hook.getContent(item.value));
const isOpen = $derived(contentAttrs["data-state"] === "open");
</script>

{#if isOpen}
	<div
		{...contentAttrs}
		id={ctx.ids.content?.(item.value) ?? contentAttrs.id}
		class={className}
		transition:slide={{ duration: 200 }}
	>
		{@render children?.()}
	</div>
{/if}
