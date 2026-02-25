<!--
	@component SelectItem
	@kind select
	@layer components

	Individual select option — role="option", aria-selected.
	MeltUI transport provides ARIA attributes via transport.item(value).
-->
<script lang="ts">
	import type { SelectItemProps } from "./types.js";
	import { getSelectContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { selectRecipe } from "./recipe.js";

	let { value, children, class: className, ...rest }: SelectItemProps = $props();

	const transport = getSelectContext();
	const recipe = selectRecipe();
</script>

<div
	{...transport.item(value)}
	class={cn(recipe.item, className)}
	data-kind="select"
	data-slot="item"
	{...rest}
>
	{@render children?.()}
</div>
