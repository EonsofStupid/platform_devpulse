<!--
	@component ContextMenuSeparator
	@description Structural visual divider for context-menu.
	Contract: kind="context-menu", slot="separator"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ContextMenuSeparatorProps } from "./types.js";

let { children, class: className, ...rest }: ContextMenuSeparatorProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ContextMenuSeparator");
</script>

<div
	{...rest}
	data-kind="context-menu"
	data-slot="separator"
	class={cn(className)}
>
	{@render children?.()}
</div>
