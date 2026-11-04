<!--
	@component DropdownMenuItem
	@kind dropdown-menu
	@slot item
	@layer components

	Individual menu item — role="menuitem".
	Supports disabled state and onSelect callback; selecting closes the menu.
-->
<script lang="ts">
import { dropdownMenuAnatomy } from "#coldlight/behaviors/navigation/dropdown-menu/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { getDropdownMenuContext } from "./context.js";
import type { DropdownMenuItemProps } from "./types.js";

let {
	children,
	disabled = false,
	onSelect,
	class: className,
	...rest
}: DropdownMenuItemProps = $props();

const id = $props.id();
const ctx = getDropdownMenuContext();

const attrs = $derived(
	mergeProps(
		ctx.hook.getItem(id, { disabled, onSelect: () => onSelect?.() }),
		dropdownMenuAnatomy.attrs.item,
		rest,
	),
);
</script>

<div {...attrs} class={cn("flex select-none items-center", className)}>
	{@render children?.()}
</div>
