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
import { createAccordionTransport } from "$lib/design/api/dsadapters/meltui/_internal/accordion/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/primitives/types.js";
import { setAccordionContext } from "./context.js";
import { accordionRecipe } from "./recipe.js";
import type { AccordionProps } from "./types.js";

let {
	multiple = false,
	disabled = false,
	value,
	onValueChange,
	children,
	class: className,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
	...rest
}: AccordionProps = $props();

// Transport is initialized once with initial config values.
// Melt handles internal reactivity via its own store layer.
const transport = createAccordionTransport({
	get multiple() {
		return multiple;
	},
	get disabled() {
		return disabled;
	},
	get value() {
		return value;
	},
	// biome-ignore lint/suspicious/noExplicitAny: callback value type varies by accordion mode
	onValueChange: (v: any) => onValueChange?.(v),
});

setAccordionContext(transport);

const recipe = accordionRecipe();

const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));
</script>

<div
	{...transport.slots.root}
	class={cn(recipe.root, visual.segments, visual.radius, className)}
	data-kind="accordion"
	data-slot="root"
	data-encoding={visual.encoding || undefined}
	{...rest}
>
	{@render children?.()}
</div>
