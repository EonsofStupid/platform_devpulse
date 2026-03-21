<!--
	@component Accordion (Root)
	@kind accordion
	@layer components

	ColdLight Accordion Root — compound behavioral component.
	Uses useAccordion() primitive hook for ARIA behavior.
	Sets context for sub-components (Item, Trigger, Content, Indicator).

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
-->
<script lang="ts">
import { useAccordion } from "$lib/design/primitives/accordion/use-accordion.svelte.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setAccordionContext } from "./context.js";
import type { AccordionRootProps } from "./types.js";

let {
	ids,
	type = "single",
	value: controlledValue,
	defaultValue,
	onValueChange,
	collapsible = false,
	disabled = false,
	dir = "ltr",
	orientation = "vertical",
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
	children,
	class: className,
	...rest
}: AccordionRootProps = $props();

const hook = useAccordion({
	type,
	value: controlledValue ?? defaultValue,
	collapsible,
	get disabled() { return disabled; },
	onValueChange: (v) => onValueChange?.({ value: v }),
});

const recipe = getRecipe("accordion.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept resolved props
const recipeClasses = $derived(recipe?.classes?.({} as any) ?? {});

setAccordionContext({
	get hook() { return hook; },
	get classes() { return recipeClasses; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get orientation() { return orientation; },
});

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
}));

const rootClasses = $derived(
	cn(recipeClasses.root, visual.segments, visual.radius, className),
);
</script>

<div
	id={ids?.root}
	{...hook.root}
	{dir}
	data-orientation={orientation}
	data-encoding={visual.encoding || undefined}
	class={rootClasses}
	{...rest}
>
	{@render children?.()}
</div>
