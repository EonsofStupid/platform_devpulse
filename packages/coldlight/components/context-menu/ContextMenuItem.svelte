<!--
	@component ContextMenuItem
	@kind context-menu
	@slot item
	@layer components

	Individual context menu item — role="menuitem".
	Supports disabled state and onSelect callback; selecting closes the menu.
-->
<script lang="ts">
import { contextMenuAnatomy } from "#coldlight/behaviors/navigation/context-menu/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { getContextMenuContext } from "./context.js";
import type { ContextMenuItemProps } from "./types.js";

let {
	children,
	disabled = false,
	onSelect,
	class: className,
	...rest
}: ContextMenuItemProps = $props();

const id = $props.id();
const ctx = getContextMenuContext();

const attrs = $derived(
	mergeProps(
		ctx.hook.menu.getItem(id, { disabled, onSelect: () => onSelect?.() }),
		contextMenuAnatomy.attrs.item,
		rest,
	),
);
</script>

<div {...attrs} class={cn("flex select-none items-center", className)}>
	{@render children?.()}
</div>
