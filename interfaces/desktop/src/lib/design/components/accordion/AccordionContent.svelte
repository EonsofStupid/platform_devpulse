<!--
	@component Accordion.Content
	@kind accordion
	@slot content
	@layer components

	The expandable content panel. Role="region", aria-labelledby from hook.
	Slides in/out with transition.
-->
<script lang="ts">
import { slide } from "svelte/transition";
import { cn } from "$lib/design/utils/cn.js";
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
		class={cn(ctx.classes.content, className)}
		transition:slide={{ duration: 200 }}
	>
		{@render children?.()}
	</div>
{/if}
