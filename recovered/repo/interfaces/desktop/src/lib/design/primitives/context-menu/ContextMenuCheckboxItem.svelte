<!--
	@component ContextMenuCheckboxItem
	@description Structural toggleable menu entry with check state for context-menu.
	Contract: kind="context-menu", slot="checkbox-item"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ContextMenuCheckboxItemProps } from "./types.js";

let { children, class: className, ...rest }: ContextMenuCheckboxItemProps = $props();

if (import.meta.env?.DEV)
	stripStyleProp(rest as Record<string, unknown>, "ContextMenuCheckboxItem");
</script>

<div
	{...rest}
	data-kind="context-menu"
	data-slot="checkbox-item"
	class={cn(className)}
>
	{@render children?.()}
</div>
