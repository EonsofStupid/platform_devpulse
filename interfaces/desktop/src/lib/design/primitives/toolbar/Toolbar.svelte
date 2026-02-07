<!--
	@component Toolbar
	@description Structural root container for toolbar controls.
	Contract: kind="toolbar", slot="root"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ToolbarProps } from "./types.js";

let { orientation = "horizontal", children, class: className, ...rest }: ToolbarProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Toolbar");
</script>

<div
	{...rest}
	data-kind="toolbar"
	data-slot="root"
	data-orientation={orientation}
	class={cn(className)}
>
	{@render children?.()}
</div>
