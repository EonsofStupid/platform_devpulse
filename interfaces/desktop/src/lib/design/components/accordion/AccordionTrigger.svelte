<!--
	@component AccordionTrigger
	@kind accordion
	@layer components

	Accordion trigger button — wrapped in heading element.
	Reads per-item context for slot attributes.
	MeltUI transport provides aria-expanded, aria-controls, keyboard handlers.

	WAI-ARIA APG: trigger has role="button", aria-expanded, aria-controls.
	Heading wraps the button for proper document outline.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getAccordionItemContext } from "./context.js";
import { accordionRecipe } from "./recipe.js";
import type { AccordionTriggerProps } from "./types.js";

let { children, class: className, ...rest }: AccordionTriggerProps = $props();

const item = getAccordionItemContext();
const recipe = accordionRecipe();
</script>

<h3 {...item.slots.heading} data-kind="accordion" data-slot="heading">
	<button
		{...item.slots.trigger}
		class={cn(recipe.trigger, className)}
		data-kind="accordion"
		data-slot="trigger"
		{...rest}
	>
		{@render children?.()}
	</button>
</h3>
