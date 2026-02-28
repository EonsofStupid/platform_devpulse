<!--
	@component MenubarContent
	@kind menubar
	@slot content
	@layer components

	Menu content dropdown — visible when the parent menu is open.
	ARIA: role="menu", aria-labelledby → trigger.
	Handles Escape to close, arrow keys for navigation.
-->
<script lang="ts">
	import type { MenubarContentProps } from "./types.js";
	import { getMenubarMenuContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { menubarRecipe } from "./recipe.js";

	let {
		children,
		size = "md",
		side = "bottom",
		align = "start",
		class: className,
		...rest
	}: MenubarContentProps = $props();

	const ctx = getMenubarMenuContext();
	const recipe = $derived(menubarRecipe({ size }));
</script>

{#if ctx.open}
	<div
		id={ctx.contentId}
		role="menu"
		aria-labelledby={ctx.triggerId}
		aria-orientation="vertical"
		tabindex={-1}
		onkeydown={(e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				ctx.close();
			}
		}}
		class={cn(recipe.content, className)}
		data-kind="menubar"
		data-slot="content"
		data-state="open"
		data-side={side}
		data-align={align}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
