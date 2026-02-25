<!--
	@component ComboboxTrigger
	@kind combobox
	@layer components

	Combobox toggle trigger button — opens/closes the listbox dropdown.
	MeltUI transport provides keyboard handlers and toggle behavior.
-->
<script lang="ts">
	import type { ComboboxTriggerProps } from "./types.js";
	import { getComboboxContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { comboboxRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: ComboboxTriggerProps = $props();

	const transport = getComboboxContext();
	const recipe = comboboxRecipe();
</script>

<button
	{...transport.slots.trigger}
	class={cn(recipe.trigger, className)}
	data-kind="combobox"
	data-slot="trigger"
	data-state={transport.states.open ? "open" : "closed"}
	{...rest}
>
	{@render children?.()}
</button>
