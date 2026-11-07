<!--
	@component ToolbarItem
	@description Structural button item within a toolbar.
	Contract: kind="toolbar", slot="item"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ToolbarItemProps } from "./types.js";

let { children, class: className, ...rest }: ToolbarItemProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ToolbarItem");
</script>

<button
	{...rest}
	data-kind="toolbar"
	data-slot="item"
	class={cn(className)}
>
	{@render children?.()}
</button>
