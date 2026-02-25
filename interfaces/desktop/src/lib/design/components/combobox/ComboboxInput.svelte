<!--
	@component ComboboxInput
	@kind combobox
	@layer components

	Combobox text input — role="combobox", aria-expanded, aria-controls.
	MeltUI transport provides ARIA attributes and keyboard handlers.
	Self-closing element — no children.
-->
<script lang="ts">
	import type { ComboboxInputProps } from "./types.js";
	import { getComboboxContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { comboboxRecipe } from "./recipe.js";

	let { class: className, ...rest }: ComboboxInputProps = $props();

	const transport = getComboboxContext();
	const recipe = comboboxRecipe();
</script>

<input
	{...transport.slots.input}
	class={cn(recipe.input, className)}
	data-kind="combobox"
	data-slot="input"
	data-state={transport.states.open ? "open" : "closed"}
	{...rest}
/>
