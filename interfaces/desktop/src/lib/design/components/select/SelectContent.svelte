<!--
	@component SelectContent
	@kind select
	@layer components

	Select content — the dropdown listbox container.
	Only visible when open state is true.
	MeltUI transport provides role="listbox", ARIA attributes.
-->
<script lang="ts">
	import type { SelectContentProps } from "./types.js";
	import { getSelectContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { selectRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: SelectContentProps = $props();

	const transport = getSelectContext();
	const recipe = selectRecipe();
</script>

{#if transport.states.open}
	<div
		{...transport.slots.content}
		class={cn(recipe.content, className)}
		data-kind="select"
		data-slot="content"
		data-state="open"
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
