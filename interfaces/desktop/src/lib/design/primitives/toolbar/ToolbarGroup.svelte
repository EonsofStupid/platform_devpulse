<!--
	@component ToolbarGroup
	@description Structural group container for related toolbar items.
	Contract: kind="toolbar", slot="group"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ToolbarGroupProps } from "./types.js";

let { children, class: className, ...rest }: ToolbarGroupProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ToolbarGroup");
</script>

<div
	{...rest}
	data-kind="toolbar"
	data-slot="group"
	class={cn(className)}
>
	{@render children?.()}
</div>
