<!--
	@component MenubarTrigger
	@kind menubar
	@slot trigger
	@layer components

	Button within the menubar that opens its associated menu.
	ARIA: role="menuitem", aria-haspopup="menu", aria-expanded, aria-controls.
	Keyboard: Enter/Space toggle, ArrowDown opens, ArrowLeft/Right navigate menus.
-->
<script lang="ts">
	import type { MenubarTriggerProps } from "./types.js";
	import { getMenubarMenuContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { menubarRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: MenubarTriggerProps = $props();

	const ctx = getMenubarMenuContext();
	const recipe = menubarRecipe();
</script>

<button
	id={ctx.triggerId}
	type="button"
	role="menuitem"
	aria-haspopup="menu"
	aria-expanded={ctx.open}
	aria-controls={ctx.open ? ctx.contentId : undefined}
	onclick={ctx.toggle}
	onkeydown={(e) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!ctx.open) ctx.toggle();
		}
	}}
	class={cn(recipe.trigger, className)}
	data-kind="menubar"
	data-slot="trigger"
	data-state={ctx.open ? "open" : "closed"}
	{...rest}
>
	{@render children?.()}
</button>
