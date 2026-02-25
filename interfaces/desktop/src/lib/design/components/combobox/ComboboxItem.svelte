<!--
	@component ComboboxItem
	@kind combobox
	@layer components

	Individual combobox option — role="option", aria-selected.
	MeltUI transport provides ARIA attributes via transport.getOption(value, label).
-->
<script lang="ts">
	import type { ComboboxItemProps } from "./types.js";
	import { getComboboxContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { comboboxRecipe } from "./recipe.js";

	let { value, label, children, class: className, ...rest }: ComboboxItemProps = $props();

	const transport = getComboboxContext();
	const recipe = comboboxRecipe();
</script>

<div
	{...transport.getOption(value, label)}
	class={cn(recipe.item, className)}
	data-kind="combobox"
	data-slot="option"
	{...rest}
>
	{@render children?.()}
</div>
