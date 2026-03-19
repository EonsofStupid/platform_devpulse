<!--
	@component AccordionContent
	@kind accordion
	@layer components

	Accordion content panel — conditionally rendered when item is expanded.
	Reads per-item context for slot attributes.
	MeltUI transport provides role="region", aria-labelledby.

	Only rendered when item.states.isExpanded is true.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAccordionItemContext } from "./context.js";
import { accordionRecipe } from "./recipe.js";
import type { AccordionContentProps } from "./types.js";

let { children, class: className, ...rest }: AccordionContentProps = $props();

const item = getAccordionItemContext();
const recipe = accordionRecipe();
</script>

{#if item.states.isExpanded}
	<div
		{...item.slots.content}
		class={cn(recipe.content, className)}
		data-kind="accordion"
		data-slot="content"
		data-state="open"
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
