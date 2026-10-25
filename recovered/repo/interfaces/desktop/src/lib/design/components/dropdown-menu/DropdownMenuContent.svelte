<!--
	@component DropdownMenuContent
	@kind dropdown-menu
	@slot content
	@layer components

	Menu content container — visible when open.
	ARIA: role="menu", aria-labelledby → trigger.
	Handles Escape to close and focus management.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDropdownMenuContext } from "./context.js";
import { dropdownMenuRecipe } from "./recipe.js";
import type { DropdownMenuContentProps } from "./types.js";

let {
	children,
	size = "md",
	side = "bottom",
	align = "start",
	class: className,
	...rest
}: DropdownMenuContentProps = $props();

const ctx = getDropdownMenuContext();
const recipe = $derived(dropdownMenuRecipe({ size }));
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
		data-kind="dropdown-menu"
		data-slot="content"
		data-state="open"
		data-side={side}
		data-align={align}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
