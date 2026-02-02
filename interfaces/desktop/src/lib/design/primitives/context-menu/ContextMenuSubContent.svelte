<!--
	@component ContextMenuSubContent
	@description Structural floating submenu panel for context-menu.
	Contract: kind="context-menu", slot="sub-content"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { ContextMenuSubContentProps } from "./types.js";
	import { getContextMenuContext } from "./context.js";

	let { children, class: className, ...rest }: ContextMenuSubContentProps = $props();
	const ctx = getContextMenuContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ContextMenuSubContent");
</script>

<div
	{...rest}
	data-kind="context-menu"
	data-slot="sub-content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
