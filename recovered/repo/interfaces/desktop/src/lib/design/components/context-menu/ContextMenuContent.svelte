<!--
	@component ContextMenuContent
	@kind context-menu
	@slot content
	@layer components

	Menu content container — positioned at right-click coordinates.
	ARIA: role="menu".
	Handles Escape to close and arrow key navigation.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getContextMenuContext } from "./context.js";
import { contextMenuRecipe } from "./recipe.js";
import type { ContextMenuContentProps } from "./types.js";

let { children, size = "md", class: className, ...rest }: ContextMenuContentProps = $props();

const ctx = getContextMenuContext();
const recipe = $derived(contextMenuRecipe({ size }));
</script>

{#if ctx.open}
	<div
		id={ctx.contentId}
		role="menu"
		aria-orientation="vertical"
		tabindex={-1}
		onkeydown={(e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				ctx.close();
			}
		}}
		style:position="fixed"
		style:left="{ctx.position.x}px"
		style:top="{ctx.position.y}px"
		class={cn(recipe.content, className)}
		data-kind="context-menu"
		data-slot="content"
		data-state="open"
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
