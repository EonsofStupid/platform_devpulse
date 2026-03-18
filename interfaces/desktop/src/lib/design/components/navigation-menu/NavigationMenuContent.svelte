<!--
	@component NavigationMenuContent
	@kind navigation-menu
	@slot content
	@layer components

	Sub-menu content container — visible when the parent item is open.
	ColdLight-owned ARIA: aria-labelledby → trigger.
	Handles Escape to close.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getNavigationMenuItemContext } from "./context.js";
import { navigationMenuRecipe } from "./recipe.js";
import type { NavigationMenuContentProps } from "./types.js";

let { children, size = "md", class: className, ...rest }: NavigationMenuContentProps = $props();

const ctx = getNavigationMenuItemContext();
const recipe = $derived(navigationMenuRecipe({ size }));
</script>

{#if ctx.open}
	<div
		id={ctx.contentId}
		aria-labelledby={ctx.triggerId}
		onkeydown={(e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				ctx.close();
			}
		}}
		class={cn(recipe.content, className)}
		data-kind="navigation-menu"
		data-slot="content"
		data-state="open"
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
