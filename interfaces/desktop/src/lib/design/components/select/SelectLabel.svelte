<!--
	@component SelectLabel
	@kind select
	@layer components

	Select label — associates a text label with the select.
	MeltUI transport provides id linking for accessibility.
-->
<script lang="ts">
	import type { SelectLabelProps } from "./types.js";
	import { getSelectContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { selectRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: SelectLabelProps = $props();

	const transport = getSelectContext();
	const recipe = selectRecipe();
</script>

<span
	{...transport.slots.label}
	class={cn(recipe.label, className)}
	data-kind="select"
	data-slot="label"
	{...rest}
>
	{@render children?.()}
</span>
