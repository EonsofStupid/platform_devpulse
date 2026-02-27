<!--
	@component DropdownMenuLabel
	@kind dropdown-menu
	@slot group-label
	@layer components

	Label for a group of menu items.
	Non-interactive — provides accessible name for group via aria-labelledby.
-->
<script lang="ts">
	import type { DropdownMenuLabelProps } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { dropdownMenuRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: DropdownMenuLabelProps = $props();

	const recipe = dropdownMenuRecipe();
</script>

<div
	class={cn(recipe.label, className)}
	data-kind="dropdown-menu"
	data-slot="group-label"
	{...rest}
>
	{@render children?.()}
</div>
