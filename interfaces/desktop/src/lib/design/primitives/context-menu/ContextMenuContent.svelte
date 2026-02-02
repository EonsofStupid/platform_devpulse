<!--
	@component ContextMenuContent
	@description Structural floating menu panel for context-menu.
	Contract: kind="context-menu", slot="content"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { ContextMenuContentProps } from "./types.js";
	import { getContextMenuContext } from "./context.js";

	let { children, class: className, ...rest }: ContextMenuContentProps = $props();
	const ctx = getContextMenuContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ContextMenuContent");
</script>

<div
	{...rest}
	data-kind="context-menu"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
