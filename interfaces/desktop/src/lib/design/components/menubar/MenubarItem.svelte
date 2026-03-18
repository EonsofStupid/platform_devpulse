<!--
	@component MenubarItem
	@kind menubar
	@slot item
	@layer components

	Individual menu item within a menubar dropdown.
	ARIA: role="menuitem". Supports disabled state and onSelect callback.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getMenubarMenuContext } from "./context.js";
import { menubarRecipe } from "./recipe.js";
import type { MenubarItemProps } from "./types.js";

let {
	children,
	disabled = false,
	onSelect,
	class: className,
	...rest
}: MenubarItemProps = $props();

const ctx = getMenubarMenuContext();
const recipe = menubarRecipe();

function handleSelect(): void {
	if (disabled) return;
	onSelect?.();
	ctx.close();
}
</script>

<div
	role="menuitem"
	tabindex={disabled ? -1 : 0}
	aria-disabled={disabled || undefined}
	onclick={handleSelect}
	onkeydown={(e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleSelect();
		}
	}}
	class={cn(recipe.item, className)}
	data-kind="menubar"
	data-slot="item"
	data-state={disabled ? "disabled" : undefined}
	{...rest}
>
	{@render children?.()}
</div>
