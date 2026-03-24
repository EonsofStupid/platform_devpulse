<!--
	@component NavigationMenuTrigger
	@kind navigation-menu
	@slot trigger
	@layer components

	Button that toggles a sub-menu within a navigation item.
	ColdLight-owned ARIA: aria-expanded, aria-haspopup, aria-controls.
	Keyboard: Enter/Space toggle, ArrowDown opens, Escape closes.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getNavigationMenuItemContext } from "./context.js";
import type { NavigationMenuTriggerProps } from "./types.js";

let { children, class: className, ...rest }: NavigationMenuTriggerProps = $props();

const ctx = getNavigationMenuItemContext();
</script>

<button
	id={ctx.triggerId}
	type="button"
	aria-expanded={ctx.open}
	aria-haspopup="true"
	aria-controls={ctx.open ? ctx.contentId : undefined}
	onclick={ctx.toggle}
	onkeydown={(e) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!ctx.open) ctx.toggle();
		} else if (e.key === "Escape") {
			e.preventDefault();
			ctx.close();
		}
	}}
	class={cn(className, className)}
	data-kind="navigation-menu"
	data-slot="trigger"
	data-state={ctx.open ? "open" : "closed"}
	{...rest}
>
	{@render children?.()}
</button>
