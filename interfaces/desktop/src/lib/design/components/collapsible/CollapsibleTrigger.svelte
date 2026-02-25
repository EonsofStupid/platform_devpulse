<!--
	@component CollapsibleTrigger
	@kind collapsible
	@layer components

	Collapsible toggle button — reads transport context for slot attributes.
	MeltUI transport provides aria-expanded, aria-controls, click handlers.

	WAI-ARIA APG: trigger has aria-expanded + aria-controls pointing to content.
-->
<script lang="ts">
	import type { CollapsibleTriggerProps } from "./types.js";
	import { getCollapsibleContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { collapsibleRecipe } from "./recipe.js";

	let {
		children,
		class: className,
		...rest
	}: CollapsibleTriggerProps = $props();

	const transport = getCollapsibleContext();
	const recipe = collapsibleRecipe();
</script>

<button
	{...transport.slots.trigger}
	class={cn(recipe.trigger, className)}
	data-kind="collapsible"
	data-slot="trigger"
	{...rest}
>
	{@render children?.()}
</button>
