<!--
	@component ContextMenuSeparator
	@kind context-menu
	@slot separator
	@layer components

	Visual and semantic separator between context menu items.
	ARIA: role="separator".
-->
<script lang="ts">
	import type { ContextMenuSeparatorProps } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { contextMenuRecipe } from "./recipe.js";

	let { class: className, ...rest }: ContextMenuSeparatorProps = $props();

	const recipe = contextMenuRecipe();
</script>

<div
	role="separator"
	class={cn(recipe.separator, className)}
	data-kind="context-menu"
	data-slot="separator"
	{...rest}
/>
