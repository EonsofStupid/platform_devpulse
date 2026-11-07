<!--
	@component ContextMenuSubTrigger
	@description Structural item that opens a submenu on hover/focus for context-menu.
	Contract: kind="context-menu", slot="sub-trigger"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ContextMenuSubTriggerProps } from "./types.js";

let { children, class: className, ...rest }: ContextMenuSubTriggerProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ContextMenuSubTrigger");
</script>

<div
	{...rest}
	data-kind="context-menu"
	data-slot="sub-trigger"
	class={cn(className)}
>
	{@render children?.()}
</div>
