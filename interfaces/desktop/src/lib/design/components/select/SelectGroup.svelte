<!--
	@component SelectGroup
	@kind select
	@layer components

	Select group — groups related options with optional label.
	MeltUI transport provides role="group" via structural slot.
-->
<script lang="ts">
	import type { SelectGroupProps } from "./types.js";
	import { getSelectContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { selectRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: SelectGroupProps = $props();

	const transport = getSelectContext();
	const recipe = selectRecipe();
</script>

<div
	{...transport.slots.group}
	class={cn(recipe.group, className)}
	data-kind="select"
	data-slot="group"
	{...rest}
>
	{@render children?.()}
</div>
