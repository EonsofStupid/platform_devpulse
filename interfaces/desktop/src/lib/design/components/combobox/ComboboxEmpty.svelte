<!--
	@component ComboboxEmpty
	@kind combobox
	@layer components

	Combobox empty state — shown when no items match the input filter.
	Purely presentational — no transport involvement.
-->
<script lang="ts">
	import type { ComboboxEmptyProps } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { comboboxRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: ComboboxEmptyProps = $props();

	const recipe = comboboxRecipe();
</script>

<div
	class={cn(recipe.empty, className)}
	data-kind="combobox"
	data-slot="empty"
	{...rest}
>
	{@render children?.()}
</div>
