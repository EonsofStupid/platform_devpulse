<!--
	@component ComboboxContent
	@kind combobox
	@layer components

	Combobox content — the dropdown listbox container.
	Only visible when open state is true.
	MeltUI transport provides role="listbox", ARIA attributes.
-->
<script lang="ts">
	import type { ComboboxContentProps } from "./types.js";
	import { getComboboxContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { comboboxRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: ComboboxContentProps = $props();

	const transport = getComboboxContext();
	const recipe = comboboxRecipe();
</script>

{#if transport.states.open}
	<div
		{...transport.slots.content}
		class={cn(recipe.content, className)}
		data-kind="combobox"
		data-slot="content"
		data-state="open"
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
