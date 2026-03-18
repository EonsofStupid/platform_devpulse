<!--
	@component DropdownMenuTrigger
	@kind dropdown-menu
	@slot trigger
	@layer components

	Button that opens/closes the dropdown menu.
	ARIA: role="button", aria-haspopup="menu", aria-expanded, aria-controls.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getDropdownMenuContext } from "./context.js";
import { dropdownMenuRecipe } from "./recipe.js";
import type { DropdownMenuTriggerProps } from "./types.js";

let { children, class: className, ...rest }: DropdownMenuTriggerProps = $props();

const ctx = getDropdownMenuContext();
const recipe = dropdownMenuRecipe();
</script>

<button
	id={ctx.triggerId}
	type="button"
	aria-haspopup="menu"
	aria-expanded={ctx.open}
	aria-controls={ctx.open ? ctx.contentId : undefined}
	onclick={ctx.toggle}
	onkeydown={(e) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!ctx.open) ctx.toggle();
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (!ctx.open) ctx.toggle();
		}
	}}
	class={cn(recipe.trigger, className)}
	data-kind="dropdown-menu"
	data-slot="trigger"
	data-state={ctx.open ? "open" : "closed"}
	{...rest}
>
	{@render children?.()}
</button>
