<!--
	@component ContextMenuItem
	@kind context-menu
	@slot item
	@layer components

	Individual context menu item — role="menuitem".
	Supports disabled state and onSelect callback.
-->
<script lang="ts">
	import type { ContextMenuItemProps } from "./types.js";
	import { getContextMenuContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { contextMenuRecipe } from "./recipe.js";

	let {
		children,
		disabled = false,
		onSelect,
		class: className,
		...rest
	}: ContextMenuItemProps = $props();

	const ctx = getContextMenuContext();
	const recipe = contextMenuRecipe();

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
	data-kind="context-menu"
	data-slot="item"
	data-state={disabled ? "disabled" : undefined}
	{...rest}
>
	{@render children?.()}
</div>
