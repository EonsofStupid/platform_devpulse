<!--
	@component ContextMenuTrigger
	@description Structural right-click target area for context-menu.
	Contract: kind="context-menu", slot="trigger"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { ContextMenuTriggerProps } from "./types.js";

	let { children, class: className, ...rest }: ContextMenuTriggerProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ContextMenuTrigger");
</script>

<div
	{...rest}
	data-kind="context-menu"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</div>
