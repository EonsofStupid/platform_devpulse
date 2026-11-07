<!--
	@component ToolbarSeparator
	@description Structural separator divider within a toolbar.
	Contract: kind="toolbar", slot="separator"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ToolbarSeparatorProps } from "./types.js";

let {
	orientation = "vertical",
	children,
	class: className,
	...rest
}: ToolbarSeparatorProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ToolbarSeparator");
</script>

<div
	{...rest}
	data-kind="toolbar"
	data-slot="separator"
	data-orientation={orientation}
	class={cn(className)}
>
	{@render children?.()}
</div>
