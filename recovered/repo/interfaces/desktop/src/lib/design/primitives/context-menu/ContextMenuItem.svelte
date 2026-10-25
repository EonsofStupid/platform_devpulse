<!--
	@component ContextMenuItem
	@description Structural selectable menu entry for context-menu.
	Contract: kind="context-menu", slot="item"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ContextMenuItemProps } from "./types.js";

let { children, class: className, ...rest }: ContextMenuItemProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ContextMenuItem");
</script>

<div
	{...rest}
	data-kind="context-menu"
	data-slot="item"
	class={cn(className)}
>
	{@render children?.()}
</div>
