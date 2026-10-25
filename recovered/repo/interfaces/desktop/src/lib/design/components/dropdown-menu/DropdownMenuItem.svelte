<!--
	@component DropdownMenuItem
	@kind dropdown-menu
	@slot item
	@layer components

	Individual menu item — role="menuitem".
	Supports disabled state and onSelect callback.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDropdownMenuContext } from "./context.js";
import { dropdownMenuRecipe } from "./recipe.js";
import type { DropdownMenuItemProps } from "./types.js";

let {
	children,
	disabled = false,
	onSelect,
	class: className,
	...rest
}: DropdownMenuItemProps = $props();

const ctx = getDropdownMenuContext();
const recipe = dropdownMenuRecipe();

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
	data-kind="dropdown-menu"
	data-slot="item"
	data-state={disabled ? "disabled" : undefined}
	{...rest}
>
	{@render children?.()}
</div>
