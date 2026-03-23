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
import { cn } from "$lib/design/utils/cn.js";
import { getNavigationMenuItemContext } from "./context.js";
import { navigationMenuComposition } from "./composition.js";
import type { NavigationMenuContentProps } from "./types.js";

let { children, size = "md", class: className, ...rest }: NavigationMenuContentProps = $props();

const ctx = getNavigationMenuItemContext();
const composition = $derived(navigationMenuComposition({ size }));
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
		class={cn(composition.content, className)}
		data-kind="navigation-menu"
		data-slot="content"
		data-state="open"
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
