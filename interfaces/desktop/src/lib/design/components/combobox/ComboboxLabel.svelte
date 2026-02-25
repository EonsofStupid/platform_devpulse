<!--
	@component ComboboxLabel
	@kind combobox
	@layer components

	Combobox label — associates a text label with the combobox input.
	MeltUI transport provides id linking for accessibility.
-->
<script lang="ts">
	import type { ComboboxLabelProps } from "./types.js";
	import { getComboboxContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { comboboxRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: ComboboxLabelProps = $props();

	const transport = getComboboxContext();
	const recipe = comboboxRecipe();
</script>

<label
	{...transport.slots.label}
	class={cn(recipe.label, className)}
	data-kind="combobox"
	data-slot="label"
	{...rest}
>
	{@render children?.()}
</label>
