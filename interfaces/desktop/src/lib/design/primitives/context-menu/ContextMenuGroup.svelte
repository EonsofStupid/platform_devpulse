<!--
	@component ContextMenuGroup
	@description Structural grouping container for context-menu items.
	Contract: kind="context-menu", slot="group"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ContextMenuGroupProps } from "./types.js";

let { children, class: className, ...rest }: ContextMenuGroupProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ContextMenuGroup");
</script>

<div
	{...rest}
	data-kind="context-menu"
	data-slot="group"
	class={cn(className)}
>
	{@render children?.()}
</div>
