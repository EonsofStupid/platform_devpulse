<!--
	@component Accordion
	@kind accordion
	@layer components

	ColdLight Accordion — compound component root.
	Creates MeltUI accordion transport and sets root context.
	Sub-components (AccordionItem, AccordionTrigger, AccordionContent)
	consume context to access their slot attributes.

	MeltUI transport adapter provides ARIA.
	ColdLight adds data-kind, data-slot, data-state.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
-->
<script lang="ts">
	import type { AccordionProps } from "./types.js";
	import { createAccordionTransport } from "$lib/design/api/adapters/meltui/_internal/accordion/index.js";
	import { setAccordionContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { accordionRecipe } from "./recipe.js";

	let {
		multiple = false,
		disabled = false,
		value,
		onValueChange,
		children,
		class: className,
		...rest
	}: AccordionProps = $props();

	// Transport is initialized once with initial config values.
	// Melt handles internal reactivity via its own store layer.
	const transport = createAccordionTransport({
		multiple,
		disabled,
		value,
		onValueChange,
	});

	setAccordionContext(transport);

	const recipe = accordionRecipe();
</script>

<div
	{...transport.slots.root}
	class={cn(recipe.root, className)}
	data-kind="accordion"
	data-slot="root"
	{...rest}
>
	{@render children?.()}
</div>
